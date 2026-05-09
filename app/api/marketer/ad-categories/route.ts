import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDb, prisma } from '@/lib/db';
import { allowMarketerModule } from '@/app/api/marketer/_permissions';
import { captureErrorToDb } from '@/lib/error-monitor';
import { DEFAULT_MARKETING_AD_CATEGORIES } from '@/lib/marketing-ad-defaults';
import { marketerAdApiUserMessage, prismaSchemaMissingMessage } from '@/lib/prisma-route-errors';

function strOrNull(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t.length ? t : null;
}

function normalizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || !(await allowMarketerModule(session.user.role as any, 'blogs'))) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await connectDb();
    let items = await prisma.marketingAdCategory.findMany({ orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }] });
    if (items.length === 0) {
      await prisma.marketingAdCategory.createMany({ data: DEFAULT_MARKETING_AD_CATEGORIES });
      items = await prisma.marketingAdCategory.findMany({ orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }] });
    }

    return NextResponse.json({ items });
  } catch (error) {
    const schemaOnly = prismaSchemaMissingMessage(error);
    const userMsg = marketerAdApiUserMessage(error);
    const status = schemaOnly ? 503 : 500;
    await captureErrorToDb({
      error,
      request: undefined,
      statusCode: userMsg ? status : 500,
      context: 'marketer/ad-categories/GET',
      user: null,
    });
    console.error('Marketer ad-categories GET error:', error);
    return NextResponse.json(
      {
        message: userMsg ?? 'Server error',
        ...(process.env.NODE_ENV === 'development' && error instanceof Error
          ? { detail: error.message.slice(0, 800) }
          : {}),
      },
      { status },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !(await allowMarketerModule(session.user.role as any, 'blogs'))) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
    }

    const slug = normalizeSlug(typeof body.slug === 'string' ? body.slug : '');
    if (!slug) {
      return NextResponse.json({ message: 'slug is required' }, { status: 400 });
    }
    const label = strOrNull(body.label);
    if (!label) {
      return NextResponse.json({ message: 'label is required' }, { status: 400 });
    }

    await connectDb();

    const existing = await prisma.marketingAdCategory.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ message: 'A category with this slug already exists' }, { status: 409 });
    }

    const maxOrder = await prisma.marketingAdCategory.aggregate({ _max: { sortOrder: true } });
    const sortOrder =
      typeof body.sortOrder === 'number' && Number.isFinite(body.sortOrder)
        ? Math.trunc(body.sortOrder)
        : (maxOrder._max.sortOrder ?? -1) + 1;

    const row = await prisma.marketingAdCategory.create({
      data: { slug, label, sortOrder },
    });

    return NextResponse.json({ item: row });
  } catch (error) {
    await captureErrorToDb({
      error,
      request: undefined,
      statusCode: 500,
      context: 'marketer/ad-categories/POST',
      user: null,
    });
    console.error('Marketer ad-categories POST error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
