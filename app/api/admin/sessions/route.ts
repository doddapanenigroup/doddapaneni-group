import { auth } from '@/lib/auth';
import { connectDb, prisma } from '@/lib/db';
import { captureErrorToDb } from '@/lib/error-monitor';
import { NextResponse } from 'next/server';
import { hasAdminAccess } from '@/lib/role-utils';

type SessionRow = {
  id: string;
  userId: string;
  loggedAt: Date;
  loggedOutAt: Date | null;
  userEmail: string;
  userName: string | null;
  userUsername: string | null;
  userRole: string;
};

function normalizeRole(raw: unknown): 'ADMIN' | 'DEVELOPER' | 'DIGITAL_MARKETER' | 'HR' {
  const v = String(raw ?? '').trim().toUpperCase();
  if (v === 'SUPER_ADMIN') return 'ADMIN';
  if (v === 'ADMIN' || v === 'DEVELOPER' || v === 'DIGITAL_MARKETER' || v === 'HR') return v;
  return 'DEVELOPER';
}

function isAdminRole(role: unknown) {
  return hasAdminAccess(role as any);
}

export async function GET(request: Request) {
  const session = await auth();
  const role = (session as { user?: { role?: string } } | null | undefined)?.user?.role;
  if (!session?.user?.id || !isAdminRole(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDb();

    const url = new URL(request.url);
    const take = Math.min(Math.max(Number(url.searchParams.get('take') ?? '100'), 1), 500);
    const activeOnly = url.searchParams.get('activeOnly') !== '0';

    const whereSql = activeOnly ? 'WHERE l.logged_out_at IS NULL' : '';
    const logs = await prisma.$queryRawUnsafe<SessionRow[]>(
      `
      SELECT
        l.id AS id,
        l.user_id AS "userId",
        l.logged_at AS "loggedAt",
        l.logged_out_at AS "loggedOutAt",
        u.email AS "userEmail",
        u.name AS "userName",
        u.username AS "userUsername",
        u.role AS "userRole"
      FROM LoginLog l
      JOIN User u ON u.id = l.user_id
      ${whereSql}
      ORDER BY l.logged_at DESC
      LIMIT ?
      `,
      take
    );

    const uaByUserId = new Map<string, string | null>();

    const sessions = logs.map((l) => ({
      id: l.id,
      userId: l.userId,
      userEmail: l.userEmail,
      userName: l.userName,
      userUsername: l.userUsername,
      userRole: normalizeRole(l.userRole),
      loggedAt: l.loggedAt.toISOString(),
      loggedOutAt: l.loggedOutAt ? l.loggedOutAt.toISOString() : null,
      deviceUserAgent: uaByUserId.get(l.userId) ?? null,
    }));

    // Also provide a per-user view for “active sessions per user”.
    const byUser: Record<
      string,
      {
        userId: string;
        userEmail: string;
        userName: string | null;
        userUsername: string | null;
        userRole: string;
        deviceUserAgent: string | null;
        activeSessions: { id: string; loggedAt: string }[];
      }
    > = {};
    for (const s of sessions) {
      if (s.loggedOutAt != null) continue;
      if (!byUser[s.userId]) {
        byUser[s.userId] = {
          userId: s.userId,
          userEmail: s.userEmail,
          userName: s.userName ?? null,
          userUsername: s.userUsername ?? null,
          userRole: String(s.userRole),
          deviceUserAgent: s.deviceUserAgent,
          activeSessions: [],
        };
      }
      byUser[s.userId].activeSessions.push({ id: s.id, loggedAt: s.loggedAt });
    }

    const res = NextResponse.json({
      sessions,
      activeByUser: Object.values(byUser).sort(
        (a, b) => b.activeSessions.length - a.activeSessions.length
      ),
    });
    res.headers.set('Cache-Control', 'private, no-store');
    return res;
  } catch (err) {
    await captureErrorToDb({
      error: err,
      request,
      statusCode: 500,
      user: { id: session.user.id, email: session.user.email ?? null, role: role ?? null },
      context: 'admin sessions list',
    });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

