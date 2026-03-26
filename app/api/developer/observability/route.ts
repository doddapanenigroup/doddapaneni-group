import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import { captureErrorToDb } from '@/lib/error-monitor';

function allowedRole(role: string | undefined): boolean {
  return role === 'DEVELOPER' || role === 'ADMIN' || role === 'SUPER_ADMIN';
}

function parseDate(value: string | null, endOfDay = false): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  if (endOfDay) d.setHours(23, 59, 59, 999);
  return d;
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    const role = session?.user?.role;
    if (!session?.user || !allowedRole(role)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const from = parseDate(url.searchParams.get('from'));
    const to = parseDate(url.searchParams.get('to'), true);
    const userId = url.searchParams.get('userId')?.trim() || undefined;
    const filterRole = url.searchParams.get('role')?.trim() || undefined;
    const take = Math.min(100, Math.max(10, Number(url.searchParams.get('take') || 40)));

    await connectDb();

    let roleUserIds: string[] | undefined;
    if (filterRole) {
      const users = await prisma.user.findMany({
        where: { role: filterRole as 'SUPER_ADMIN' | 'ADMIN' | 'DEVELOPER' | 'DIGITAL_MARKETER' },
        select: { id: true },
      });
      roleUserIds = users.map((u) => u.id);
      if (roleUserIds.length === 0) roleUserIds = ['__none__'];
    }

    const ids = userId ? [userId] : roleUserIds;
    const dateWhere = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    };

    const [users, loginLogs, pageViews, webVitals, visits] = await Promise.all([
      prisma.user.findMany({
        where: { role: { in: ['DEVELOPER', 'ADMIN', 'SUPER_ADMIN'] } },
        select: { id: true, email: true, name: true, role: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.loginLog.findMany({
        where: {
          ...(Object.keys(dateWhere).length ? { loggedAt: dateWhere } : {}),
          ...(ids ? { userId: { in: ids } } : {}),
        },
        select: {
          id: true,
          userId: true,
          loggedAt: true,
          loggedOutAt: true,
          user: { select: { email: true, role: true, name: true } },
        },
        orderBy: { loggedAt: 'desc' },
        take,
      }),
      prisma.developerPageView.findMany({
        where: {
          ...(Object.keys(dateWhere).length ? { visitedAt: dateWhere } : {}),
          ...(ids ? { userId: { in: ids } } : {}),
        },
        select: { id: true, userId: true, path: true, visitedAt: true },
        orderBy: { visitedAt: 'desc' },
        take,
      }),
      prisma.webVitalReport.findMany({
        where: {
          ...(Object.keys(dateWhere).length ? { createdAt: dateWhere } : {}),
          ...(ids ? { userId: { in: ids } } : {}),
        },
        select: { id: true, name: true, value: true, rating: true, pagePath: true, userId: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take,
      }),
      prisma.visit.findMany({
        where: Object.keys(dateWhere).length ? { visitedAt: dateWhere } : undefined,
        select: { id: true, visitedAt: true, pagePath: true, ipAddress: true, userAgent: true },
        orderBy: { visitedAt: 'desc' },
        take,
      }),
    ]);

    return NextResponse.json({
      filters: { from: from?.toISOString() ?? null, to: to?.toISOString() ?? null, userId: userId ?? null, role: filterRole ?? null },
      users,
      summary: {
        loginLogs: loginLogs.length,
        pageViews: pageViews.length,
        webVitals: webVitals.length,
        visits: visits.length,
      },
      loginLogs: loginLogs.map((l) => ({
        id: l.id,
        userId: l.userId,
        userEmail: l.user.email,
        userName: l.user.name,
        userRole: l.user.role,
        loggedAt: l.loggedAt.toISOString(),
        loggedOutAt: l.loggedOutAt ? l.loggedOutAt.toISOString() : null,
      })),
      pageViews: pageViews.map((p) => ({
        id: p.id,
        userId: p.userId,
        path: p.path,
        visitedAt: p.visitedAt.toISOString(),
      })),
      webVitals: webVitals.map((v) => ({
        id: v.id,
        name: v.name,
        value: v.value,
        rating: v.rating,
        pagePath: v.pagePath,
        userId: v.userId,
        createdAt: v.createdAt.toISOString(),
      })),
      visits: visits.map((v) => ({
        id: v.id,
        visitedAt: v.visitedAt.toISOString(),
        pagePath: v.pagePath,
        ipAddress: v.ipAddress,
        userAgent: v.userAgent,
      })),
    });
  } catch (error) {
    await captureErrorToDb({
      error,
      request,
      statusCode: 500,
      context: 'developer/observability/GET',
      user: null,
    });
    console.error('Developer observability GET error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

