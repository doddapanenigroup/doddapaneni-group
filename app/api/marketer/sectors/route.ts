import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import { allowMarketerModule } from '@/app/api/marketer/_permissions';
import { captureErrorToDb } from '@/lib/error-monitor';
import { COMPANY_DIVISION_SLUGS } from '@/lib/company-divisions';

const canonicalSectorOrder: Map<string, number> = new Map(
  COMPANY_DIVISION_SLUGS.map((s, i) => [s, i]),
);

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || !(await allowMarketerModule(session.user.role as any, 'blogs'))) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await connectDb();
    const items = await prisma.sector.findMany({
      where: { slug: { in: [...COMPANY_DIVISION_SLUGS] } },
      select: { id: true, name: true, slug: true, description: true, isLive: true },
    });
    items.sort(
      (a, b) =>
        (canonicalSectorOrder.get(a.slug.trim().toLowerCase()) ?? 999) -
        (canonicalSectorOrder.get(b.slug.trim().toLowerCase()) ?? 999),
    );

    return NextResponse.json({ items });
  } catch (error) {
    await captureErrorToDb({
      error,
      request: undefined,
      statusCode: 500,
      context: 'marketer/sectors/GET',
      user: null,
    });
    console.error('Marketer sectors GET error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

