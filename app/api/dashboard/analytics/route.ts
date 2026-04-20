import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { hasMarketerAccess } from '@/lib/role-utils';
import { connectDb, prisma } from '@/lib/db';
import { captureErrorToDb } from '@/lib/error-monitor';
export const dynamic = 'force-dynamic';

const MAX_DAYS = 90;
const DEFAULT_DAYS = 30;
const MAX_RANGE_DAYS = 90; /* inclusive; matches longest preset and caps custom range */

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

/** Parse `YYYY-MM-DD` as UTC midnight. */
function parseYmdUtcStart(value: string | null): Date | null {
  if (value == null || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const t = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(t.getTime())) return null;
  return t;
}

function endOfUtcDay(startOfDayUtc: Date): Date {
  return new Date(
    Date.UTC(
      startOfDayUtc.getUTCFullYear(),
      startOfDayUtc.getUTCMonth(),
      startOfDayUtc.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );
}

/** Inclusive number of calendar days from start to end (UTC dates). */
function inclusiveUtcRangeDays(sinceStart: Date, untilStart: Date): number {
  const ms = untilStart.getTime() - sinceStart.getTime();
  if (ms < 0) return 0;
  return Math.floor(ms / 86_400_000) + 1;
}

export async function GET(request: Request) {
  const session = await auth();
  const role = session?.user?.role;
  const allowed = hasMarketerAccess(role as any);

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
  const now = new Date();
  const startOfTodayUtc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0),
  );
  const endOfTodayUtc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999),
  );

  const sinceYmd = url.searchParams.get('since');
  const untilYmd = url.searchParams.get('until');
  const customSince = parseYmdUtcStart(sinceYmd);
  const customUntilStart = parseYmdUtcStart(untilYmd);

  let since: Date;
  let untilDay: Date;
  let rangeDays: number;

  if (customSince && customUntilStart) {
    if (customSince.getTime() > customUntilStart.getTime()) {
      return NextResponse.json({ message: 'Invalid range: since must be on or before until' }, { status: 400 });
    }
    const span = inclusiveUtcRangeDays(customSince, customUntilStart);
    if (span > MAX_RANGE_DAYS) {
      return NextResponse.json(
        { message: `Date range must be at most ${MAX_RANGE_DAYS} days` },
        { status: 400 },
      );
    }
    if (customUntilStart.getTime() > endOfTodayUtc.getTime()) {
      return NextResponse.json({ message: 'End date cannot be in the future' }, { status: 400 });
    }
    since = new Date(customSince);
    untilDay = endOfUtcDay(customUntilStart);
    rangeDays = span;
  } else {
    const days = clampDays(url.searchParams.get('days'));
    since = new Date(startOfTodayUtc);
    since.setUTCDate(since.getUTCDate() - (days - 1));
    untilDay = endOfTodayUtc;
    rangeDays = days;
  }

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
    const seriesEndDayStart = new Date(
      Date.UTC(
        untilDay.getUTCFullYear(),
        untilDay.getUTCMonth(),
        untilDay.getUTCDate(),
        0,
        0,
        0,
        0,
      ),
    );
    const cursor = new Date(
      Date.UTC(
        since.getUTCFullYear(),
        since.getUTCMonth(),
        since.getUTCDate(),
        0,
        0,
        0,
        0,
      ),
    );
    while (cursor.getTime() <= seriesEndDayStart.getTime()) {
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
      rangeDays: rangeDays,
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
