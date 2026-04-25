import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDb, prisma } from '@/lib/db';
import { captureErrorToDb } from '@/lib/error-monitor';
import { hasAdminAccess } from '@/lib/role-utils';
import type { ContentEditLog, MarketingActivityLog, Role } from '@/lib/prisma-generated';

type LoginWithUserRow = {
  id: string;
  loggedAt: Date;
  loggedOutAt: Date | null;
  userEmail: string;
  userName: string | null;
  userUsername: string | null;
  userRole: string;
};

function normalizeRole(raw: unknown): 'ADMIN' | 'DEVELOPER' | 'DIGITAL_MARKETER' {
  const v = String(raw ?? '').trim().toUpperCase();
  if (v === 'SUPER_ADMIN') return 'ADMIN';
  if (v === 'ADMIN' || v === 'DEVELOPER' || v === 'DIGITAL_MARKETER') return v;
  return 'DEVELOPER';
}

export async function GET() {
  const session = await auth();
  const role = session?.user?.role;

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  if (!hasAdminAccess(role as Role | null | undefined)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDb();

    const [recentLogins, contentEdits, marketingActivity] = await Promise.all([
      prisma.$queryRaw<LoginWithUserRow[]>`
        SELECT
          l.id AS id,
          l.logged_at AS "loggedAt",
          l.logged_out_at AS "loggedOutAt",
          u.email AS "userEmail",
          u.name AS "userName",
          u.username AS "userUsername",
          u.role AS "userRole"
        FROM LoginLog l
        JOIN User u ON u.id = l.user_id
        ORDER BY l.logged_at DESC
        LIMIT 40
      `,
      prisma.contentEditLog.findMany({
        take: 40,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.marketingActivityLog.findMany({
        take: 40,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const res = NextResponse.json({
      recentLogins: (recentLogins as LoginWithUserRow[]).map((l) => ({
        id: l.id,
        loggedAt: l.loggedAt.toISOString(),
        loggedOutAt: l.loggedOutAt ? l.loggedOutAt.toISOString() : null,
        userEmail: l.userEmail,
        userName: l.userName,
        userUsername: l.userUsername,
        userRole: normalizeRole(l.userRole),
      })),
      contentEdits: (contentEdits as ContentEditLog[]).map((c) => ({
        id: c.id,
        createdAt: c.createdAt.toISOString(),
        userEmail: c.userEmail,
        userRole: c.userRole,
        kind: c.kind,
        targetPath: c.targetPath,
        summary: c.summary,
      })),
      marketingActivity: (marketingActivity as MarketingActivityLog[]).map((m) => ({
        id: m.id,
        createdAt: m.createdAt.toISOString(),
        userEmail: m.userEmail,
        userRole: m.userRole,
        entity: m.entity,
        action: m.action,
        entityId: m.entityId,
        seoNote: m.seoNote,
      })),
    });
    res.headers.set('Cache-Control', 'private, no-store');
    return res;
  } catch (error) {
    await captureErrorToDb({
      error,
      request: undefined,
      statusCode: 500,
      context: 'dashboard/admin-insights/GET',
      user: session?.user
        ? { id: session.user.id, email: session.user.email ?? null, role: session.user.role }
        : null,
    });
    console.error('Admin insights error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
