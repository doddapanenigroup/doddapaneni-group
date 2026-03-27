import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import { recordApiRequest } from '@/lib/request-monitor';
import { captureErrorToDb } from '@/lib/error-monitor';
import { hasDeveloperAccess } from '@/lib/role-utils';

function isAllowed(role: unknown) {
  return hasDeveloperAccess(role as any);
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await auth();
  const role = (session as { user?: { role?: string } } | null | undefined)?.user?.role;
  recordApiRequest({ request, userId: session?.user?.id ?? null });
  if (!session?.user?.id || !isAllowed(role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDb();
    const url = new URL(request.url);
    const take = Math.min(Math.max(Number(url.searchParams.get('take') ?? '200'), 1), 500);
    const action = (url.searchParams.get('action') ?? '').trim();
    const actorUserId = (url.searchParams.get('actorUserId') ?? '').trim();

    const rows = await prisma.auditLog.findMany({
      where: {
        ...(action ? { action } : {}),
        ...(actorUserId ? { actorUserId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        createdAt: true,
        actorUserId: true,
        actorEmail: true,
        actorRole: true,
        action: true,
        targetType: true,
        targetId: true,
        targetLabel: true,
        ipAddress: true,
        userAgent: true,
        payloadJson: true,
      },
    });

    return NextResponse.json({
      items: rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    await captureErrorToDb({
      error: err,
      request,
      statusCode: 500,
      user: { id: session.user.id, email: session.user.email ?? null, role: role ?? null },
      context: 'developer audit list',
    });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

