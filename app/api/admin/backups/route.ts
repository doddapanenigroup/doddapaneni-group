import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import { captureErrorToDb } from '@/lib/error-monitor';
import { buildBackupJson, backupDigest, saveBackupToDb } from '@/lib/db-backup';
import { hasAdminAccess } from '@/lib/role-utils';

function isAdminRole(role: unknown) {
  return hasAdminAccess(role as any);
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await auth();
  const role = (session as { user?: { role?: string } } | null | undefined)?.user?.role;
  if (!session?.user?.id || !isAdminRole(role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDb();
    const url = new URL(request.url);
    const take = Math.min(Math.max(Number(url.searchParams.get('take') ?? '50'), 1), 200);
    const rows = await prisma.dbBackup.findMany({
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        createdAt: true,
        createdByEmail: true,
        createdByRole: true,
        label: true,
        includeMedia: true,
        sha256: true,
        sizeBytes: true,
      },
    });
    return NextResponse.json({
      items: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
    });
  } catch (err) {
    await captureErrorToDb({
      error: err,
      request,
      statusCode: 500,
      user: { id: session.user.id, email: session.user.email ?? null, role: role ?? null },
      context: 'admin backups list',
    });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  const role = (session as { user?: { role?: string } } | null | undefined)?.user?.role;
  if (!session?.user?.id || !isAdminRole(role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = (await request.json().catch(() => null)) as
      | { includeMedia?: unknown; label?: unknown }
      | null;
    const includeMedia = body?.includeMedia === true;
    const label = typeof body?.label === 'string' ? body.label.trim().slice(0, 120) : null;

    await connectDb();
    const json = await buildBackupJson({ includeMedia });
    const { sha256, sizeBytes, dataJson } = backupDigest(json);

    const row = await saveBackupToDb({
      createdBy: { id: session.user.id, email: session.user.email ?? null, role: session.user.role ?? null },
      label,
      includeMedia,
      dataJson,
      sha256,
      sizeBytes,
    });

    return NextResponse.json({ ok: true, backup: { ...row, createdAt: row.createdAt.toISOString() } });
  } catch (err) {
    await captureErrorToDb({
      error: err,
      request,
      statusCode: 500,
      user: { id: session.user.id, email: session.user.email ?? null, role: role ?? null },
      context: 'admin backups create',
    });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

