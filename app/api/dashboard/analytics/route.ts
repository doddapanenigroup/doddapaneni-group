import { NextResponse } from 'next/server';
import { getServerSession } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import { captureErrorToDb } from '@/lib/error-monitor';
import { isDashboardRole } from '@/lib/role-utils';
export const dynamic = 'force-dynamic';

const MAX_DAYS = 90;
const DEFAULT_DAYS = 30;

function isBlogPath(path: string | null): boolean {
  if (!path) return false;
  const p = path.toLowerCase();
  return p.includes('/news/') || p.includes('/blog/');
}

function clampDays(raw: string | null): number {
  const n = raw ? Number.parseInt(raw, 10) : DEFAULT_DAYS;
  if (!Number.isFinite(n) || n < 1) return DEFAULT_DAYS;
  return Math.min(MAX_DAYS, Math.floor(n));
}

export async function GET(request: Request) {
  const session = await getServerSession();
  const role = session?.user?.role;
  const allowed = isDashboardRole(role as any);

  console.info('[dashboard/analytics] auth check', {
    hasSession: Boolean(session?.user?.id),
    userId: session?.user?.id ?? null,
    role: role ?? null,
  });

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  if (!allowed) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const days = clampDays(url.searchParams.get('days'));
  const now = new Date();
  const startOfTodayUtc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)
  );
  const untilDay = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999)
  );
  const since = new Date(startOfTodayUtc);
  since.setUTCDate(since.getUTCDate() - (days - 1));

  try {
    await connectDb();

    const [
      pageViewsTotal,
      dailyRows,
      pathGroups,
      vitalsByMetric,
      blogLcpAgg,
    ] = await Promise.all([
      prisma.visit.count({
        where: { visitedAt: { gte: since, lte: untilDay } },
      }),
      prisma.$queryRaw<Array<{ d: Date; c: bigint }>>`
        SELECT (date_trunc('day', visited_at AT TIME ZONE 'UTC'))::date AS d,
               COUNT(*)::bigint AS c
        FROM "Visit"
        WHERE visited_at >= ${since}
          AND visited_at <= ${untilDay}
        GROUP BY 1
        ORDER BY 1 ASC
      `,
      prisma.visit.groupBy({
        by: ['pagePath'],
        where: {
          visitedAt: { gte: since, lte: untilDay },
          pagePath: { not: null },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 50,
      }),
      prisma.webVitalReport.groupBy({
        by: ['name'],
        where: { createdAt: { gte: since, lte: untilDay } },
        _avg: { value: true },
        _count: { id: true },
      }),
      prisma.webVitalReport.aggregate({
        where: {
          createdAt: { gte: since, lte: untilDay },
          name: 'LCP',
          OR: [
            { pagePath: { contains: '/news/', mode: 'insensitive' } },
            { pagePath: { contains: '/blog/', mode: 'insensitive' } },
          ],
        },
        _avg: { value: true },
        _count: { id: true },
      }),
    ]);

    const pathRows = pathGroups.map((row) => ({
      path: row.pagePath as string,
      views: row._count.id,
    }));

    const topPages = pathRows.slice(0, 15);

    const blogRows = pathRows
      .filter((r) => isBlogPath(r.path))
      .sort((a, b) => b.views - a.views);
    const topBlogPosts = blogRows.slice(0, 10);
    const blogTotalViews = blogRows.reduce((s, r) => s + r.views, 0);

    const dailyMap = new Map<string, number>();
    for (const row of dailyRows) {
      const key = row.d.toISOString().slice(0, 10);
      dailyMap.set(key, Number(row.c));
    }

    const series: { date: string; views: number }[] = [];
    const cursor = new Date(since);
    while (cursor <= startOfTodayUtc) {
      const key = cursor.toISOString().slice(0, 10);
      series.push({ date: key, views: dailyMap.get(key) ?? 0 });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    const webVitals = vitalsByMetric
      .map((v) => ({
        name: v.name,
        avgValue: v._avg.value != null ? Math.round(v._avg.value * 1000) / 1000 : null,
        samples: v._count.id,
      }))
      .filter((v) => v.samples > 0)
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      rangeDays: days,
      since: since.toISOString(),
      until: untilDay.toISOString(),
      productionTrafficOnly: process.env.NODE_ENV !== 'production',
      totals: {
        pageViews: pageViewsTotal,
        newsViews: blogTotalViews,
      },
      series,
      topPages,
      news: {
        totalViews: blogTotalViews,
        topPosts: topBlogPosts,
        lcpAvgMs:
          blogLcpAgg._count.id > 0 && blogLcpAgg._avg.value != null
            ? Math.round(blogLcpAgg._avg.value)
            : null,
        lcpSamples: blogLcpAgg._count.id,
      },
      webVitals,
    });
  } catch (error) {
    await captureErrorToDb({
      error,
      request,
      statusCode: 500,
      user: session.user,
      context: 'dashboard/analytics/GET',
    });
    console.error('Dashboard analytics error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
