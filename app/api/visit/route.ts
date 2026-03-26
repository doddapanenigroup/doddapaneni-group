import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { connectDb, prisma } from '@/lib/db';
import { formatInIST, formatInET } from '@/lib/date-timezones';
import { captureErrorToDb } from '@/lib/error-monitor';

/** Only record website visits when the app is live (production). Local/dev visits are not counted. */
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.json({ ok: true });
  }

  let pagePath: string | null = null;
  try {
    const body = await request.json();
    pagePath = typeof body?.pagePath === 'string' ? body.pagePath.trim().slice(0, 2048) : null;
  } catch {
    pagePath = null;
  }

  try {
    await connectDb();
    const visitedAt = new Date();
    const h = await headers();
    const forwarded = h.get('x-forwarded-for');
    const ipAddress = forwarded?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null;
    const userAgent = h.get('user-agent')?.slice(0, 512) ?? null;

    await prisma.visit.create({
      data: {
        visitedAt,
        visitedAtIST: formatInIST(visitedAt),
        visitedAtET: formatInET(visitedAt),
        pagePath: pagePath || null,
        ipAddress,
        userAgent,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    await captureErrorToDb({
      error,
      request,
      statusCode: 500,
      context: 'visit/POST',
    });
    console.error('Record visit error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
