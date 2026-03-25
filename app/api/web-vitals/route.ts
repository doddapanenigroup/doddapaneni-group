import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';

type VitalPayload = {
  name?: string;
  value?: number;
  rating?: string;
  delta?: number;
  idMetric?: string;
  navigationType?: string;
  pagePath?: string;
};

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.json({ ok: true });
  }

  let raw: VitalPayload | VitalPayload[] | null = null;
  try {
    const text = await request.text();
    if (!text) return NextResponse.json({ ok: true });
    raw = JSON.parse(text) as VitalPayload | VitalPayload[];
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }

  const entries = Array.isArray(raw) ? raw : [raw];
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const userAgent = request.headers.get('user-agent')?.slice(0, 512) ?? null;

  try {
    await connectDb();
    for (const e of entries) {
      const name = typeof e?.name === 'string' ? e.name : '';
      const value = typeof e?.value === 'number' && !isNaN(e.value) ? e.value : null;
      if (!name || value === null) continue;
      await prisma.webVitalReport.create({
        data: {
          name,
          value,
          rating: typeof e.rating === 'string' ? e.rating : null,
          delta: typeof e.delta === 'number' ? e.delta : null,
          idMetric: typeof e.idMetric === 'string' ? e.idMetric.slice(0, 128) : null,
          navigationType: typeof e.navigationType === 'string' ? e.navigationType : null,
          pagePath:
            typeof e.pagePath === 'string' ? e.pagePath.slice(0, 2048) : null,
          userId,
          userAgent,
        },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Web vitals ingest error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
