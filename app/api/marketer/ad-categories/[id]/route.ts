import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDb, prisma } from '@/lib/db';
import { allowMarketerModule } from '@/app/api/marketer/_permissions';
import { captureErrorToDb } from '@/lib/error-monitor';

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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id || !(await allowMarketerModule(session.user.role as any, 'blogs'))) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    if (!id?.trim()) return NextResponse.json({ message: 'Invalid id' }, { status: 400 });

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
    }

    await connectDb();
    const current = await prisma.marketingAdCategory.findUnique({ where: { id: id.trim() } });
    if (!current) return NextResponse.json({ message: 'Not found' }, { status: 404 });

    let nextSlug = current.slug;
    if (typeof body.slug === 'string') {
      const s = normalizeSlug(body.slug);
      if (!s) return NextResponse.json({ message: 'Invalid slug' }, { status: 400 });
      if (s !== current.slug) {
        const clash = await prisma.marketingAdCategory.findUnique({ where: { slug: s } });
        if (clash) return NextResponse.json({ message: 'Slug already in use' }, { status: 409 });
        nextSlug = s;
      }
    }

    const row = await prisma.marketingAdCategory.update({
      where: { id: current.id },
      data: {
        slug: nextSlug,
        ...(typeof body.label === 'string' ? { label: body.label.trim() } : {}),
        ...(typeof body.sortOrder === 'number' && Number.isFinite(body.sortOrder)
          ? { sortOrder: Math.trunc(body.sortOrder) }
          : {}),
      },
    });

    return NextResponse.json({ item: row });
  } catch (error) {
    await captureErrorToDb({
      error,
      request: undefined,
      statusCode: 500,
      context: 'marketer/ad-categories/[id]/PATCH',
      user: null,
    });
    console.error('Marketer ad-categories PATCH error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id || !(await allowMarketerModule(session.user.role as any, 'blogs'))) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    if (!id?.trim()) return NextResponse.json({ message: 'Invalid id' }, { status: 400 });

    await connectDb();
    await prisma.marketingAdCategory.delete({ where: { id: id.trim() } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    await captureErrorToDb({
      error,
      request: undefined,
      statusCode: 500,
      context: 'marketer/ad-categories/[id]/DELETE',
      user: null,
    });
    console.error('Marketer ad-categories DELETE error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
