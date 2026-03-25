import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    const role = session?.user?.role;
    const allowed =
      role === 'ADMIN' ||
      role === 'SUPER_ADMIN' ||
      role === 'DIGITAL_MARKETER';
    if (!session?.user || !allowed) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await connectDb();
    const visits = await prisma.visit.findMany({
      orderBy: { visitedAt: 'asc' },
      select: { visitedAt: true },
    });
    const total = visits.length;
    if (total === 0) {
      return NextResponse.json({
        total: 0,
        firstVisitAt: null,
        averagePerMonth: 0,
        averagePerYear: 0,
        visitsByMonth: [],
        visitsByYear: [],
      });
    }

    const firstVisitAt = visits[0].visitedAt;
    const lastVisitAt = visits[visits.length - 1].visitedAt;
    const monthsSinceStart = Math.max(
      1,
      (new Date(lastVisitAt).getTime() - new Date(firstVisitAt).getTime()) /
        (1000 * 60 * 60 * 24 * 30.44)
    );
    const yearsSinceStart = Math.max(
      0.08,
      (new Date(lastVisitAt).getTime() - new Date(firstVisitAt).getTime()) /
        (1000 * 60 * 60 * 24 * 365.25)
    );
    const averagePerMonth = total / monthsSinceStart;
    const averagePerYear = total / yearsSinceStart;

    const byMonth: Record<string, number> = {};
    const byYear: Record<string, number> = {};
    for (const v of visits) {
      const d = new Date(v.visitedAt);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const yearKey = String(d.getFullYear());
      byMonth[monthKey] = (byMonth[monthKey] ?? 0) + 1;
      byYear[yearKey] = (byYear[yearKey] ?? 0) + 1;
    }
    const visitsByMonth = Object.entries(byMonth)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));
    const visitsByYear = Object.entries(byYear)
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year.localeCompare(b.year));

    return NextResponse.json({
      total,
      firstVisitAt,
      averagePerMonth: Math.round(averagePerMonth * 100) / 100,
      averagePerYear: Math.round(averagePerYear * 100) / 100,
      visitsByMonth,
      visitsByYear,
    });
  } catch (error) {
    console.error('Visits stats error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
