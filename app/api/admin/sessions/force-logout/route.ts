import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import { captureErrorToDb } from '@/lib/error-monitor';
import { NextResponse } from 'next/server';
import { hasAdminAccess } from '@/lib/role-utils';

function isAdminRole(role: unknown) {
  return hasAdminAccess(role as any);
}

export async function POST(request: Request) {
  const session = await auth();
  const role = (session as { user?: { role?: string } } | null | undefined)?.user?.role;
  if (!session?.user?.id || !isAdminRole(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = (await request.json().catch(() => null)) as { userId?: unknown } | null;
    const userId = typeof body?.userId === 'string' ? body.userId : '';
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    await connectDb();
    const now = new Date();

    // Revoke JWT sessions (enforced in dashboard layout) and close any “active” LoginLog records.
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { sessionRevokedAt: now },
      }),
      prisma.loginLog.updateMany({
        where: { userId, loggedOutAt: null },
        data: { loggedOutAt: now },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    await captureErrorToDb({
      error: err,
      request,
      statusCode: 500,
      user: { id: session.user.id, email: session.user.email ?? null, role: role ?? null },
      context: 'admin force logout',
    });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

