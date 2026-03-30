import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import { captureErrorToDb } from '@/lib/error-monitor';
import { upsertFlagshipCompaniesFromSeed } from '@/lib/flagship-companies-upsert';
import { hasAdminAccess } from '@/lib/role-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAdminRole(role: unknown) {
  return hasAdminAccess(role as Parameters<typeof hasAdminAccess>[0]);
}

export async function POST(request: Request) {
  const session = await auth();
  const role = (session as { user?: { role?: string } } | null | undefined)?.user?.role;
  if (!session?.user?.id || !isAdminRole(role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDb();
    const { upserted, skipped } = await upsertFlagshipCompaniesFromSeed(prisma);
    return NextResponse.json({ ok: true, upserted, skipped });
  } catch (error) {
    await captureErrorToDb({
      error,
      request,
      statusCode: 500,
      context: 'admin/companies/sync-flagships/POST',
      user: { id: session.user.id, email: session.user.email ?? null, role: role ?? null },
    });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
