import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import { captureErrorToDb } from '@/lib/error-monitor';
import { NextResponse } from 'next/server';
import { hasAdminAccess } from '@/lib/role-utils';

function isAdminRole(role: unknown) {
  return hasAdminAccess(role as any);
}

type LatestUaRow = { userId: string; userAgent: string | null; visitedAt: Date };

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

    const logs = await prisma.loginLog.findMany({
      where: activeOnly ? { loggedOutAt: null } : undefined,
      orderBy: { loggedAt: 'desc' },
      take,
      select: {
        id: true,
        userId: true,
        loggedAt: true,
        loggedOutAt: true,
        user: { select: { email: true, role: true, name: true, username: true } },
      },
    });

    const userIds = Array.from(new Set(logs.map((l) => l.userId)));
    const uaByUserId = new Map<string, string | null>();
    if (userIds.length > 0) {
      // Best-effort "device": use the most recent DashboardVisit user-agent per user.
      // (Avoids raw SQL + keeps it portable across Prisma runtimes.)
      const visits = await prisma.dashboardVisit.findMany({
        where: { userId: { in: userIds } },
        orderBy: { visitedAt: 'desc' },
        take: Math.min(userIds.length * 10, 5000),
        select: { userId: true, userAgent: true, visitedAt: true },
      });
      for (const v of visits as LatestUaRow[]) {
        if (!uaByUserId.has(v.userId)) uaByUserId.set(v.userId, v.userAgent);
      }
    }

    const sessions = logs.map((l) => ({
      id: l.id,
      userId: l.userId,
      userEmail: l.user.email,
      userName: l.user.name,
      userUsername: l.user.username,
      userRole: l.user.role,
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

    return NextResponse.json({
      sessions,
      activeByUser: Object.values(byUser).sort(
        (a, b) => b.activeSessions.length - a.activeSessions.length
      ),
    });
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

