import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import type {
  ContentEditLog,
  MarketingActivityLog,
  Prisma,
  Role,
} from '@/lib/prisma-generated';

type LoginWithUser = Prisma.LoginLogGetPayload<{
  include: { user: { select: { email: true; name: true; role: true } } };
}>;

type DashboardVisitByRole = {
  role: Role;
  _count: { id: number };
};

type WebVitalGroupRow = {
  name: string;
  _avg: { value: number | null };
  _count: { id: number };
};

export async function GET() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || (role !== 'SUPER_ADMIN' && role !== 'ADMIN')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDb();
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const [
      recentLogins,
      contentEdits,
      marketingActivity,
      visitCount7d,
      dashboardVisits7d,
      webVitals,
    ] = await Promise.all([
      prisma.loginLog.findMany({
        take: 40,
        orderBy: { loggedAt: 'desc' },
        include: {
          user: { select: { email: true, name: true, role: true } },
        },
      }),
      prisma.contentEditLog.findMany({
        take: 40,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.marketingActivityLog.findMany({
        take: 40,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.visit.count({ where: { visitedAt: { gte: since } } }),
      prisma.dashboardVisit.groupBy({
        by: ['role'],
        where: { visitedAt: { gte: since } },
        _count: { id: true },
      }),
      prisma.webVitalReport.groupBy({
        by: ['name'],
        where: { createdAt: { gte: since } },
        _avg: { value: true },
        _count: { id: true },
      }),
    ]);

    return NextResponse.json({
      recentLogins: (recentLogins as LoginWithUser[]).map((l) => ({
        id: l.id,
        loggedAt: l.loggedAt.toISOString(),
        loggedOutAt: l.loggedOutAt ? l.loggedOutAt.toISOString() : null,
        userEmail: l.user.email,
        userName: l.user.name,
        userRole: l.user.role,
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
      visitsLast7Days: visitCount7d,
      dashboardVisitsByRole: (dashboardVisits7d as DashboardVisitByRole[]).map((d) => ({
        role: d.role,
        count: d._count.id,
      })),
      webVitals7d: (webVitals as WebVitalGroupRow[]).map((w) => ({
        name: w.name,
        avgValue: w._avg.value,
        samples: w._count.id,
      })),
    });
  } catch (error) {
    console.error('Admin insights error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
