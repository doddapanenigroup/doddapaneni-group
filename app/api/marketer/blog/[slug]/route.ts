import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import { logMarketingActivity } from '@/lib/audit-log';
import { logContentEdit } from '@/lib/audit-log';

function allowMarketer(session: { user?: { role?: string } } | null) {
  const role = session?.user?.role;
  return role === 'DIGITAL_MARKETER' || role === 'ADMIN' || role === 'SUPER_ADMIN';
}

function strOrNull(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t.length ? t : null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !allowMarketer(session)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { slug } = await params;
    await connectDb();
    const doc = await prisma.blog.findUnique({ where: { slug: slug.trim() } });
    if (!doc) return NextResponse.json({ message: 'Blog not found' }, { status: 404 });
    return NextResponse.json({ item: doc });
  } catch (error) {
    console.error('Marketer blog(slug) GET error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !allowMarketer(session)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { slug } = await params;
    const currentSlug = slug.trim();
    if (!currentSlug) return NextResponse.json({ message: 'Invalid slug' }, { status: 400 });

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
    }

    await connectDb();
    const existing = await prisma.blog.findUnique({ where: { slug: currentSlug } });
    if (!existing) return NextResponse.json({ message: 'Blog not found' }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim();
    if (typeof body.slug === 'string' && body.slug.trim()) data.slug = body.slug.trim();
    if (typeof body.content === 'string') data.content = body.content;
    if ('featuredImage' in body) data.featuredImage = strOrNull(body.featuredImage);
    if ('metaTitle' in body) data.metaTitle = strOrNull(body.metaTitle);
    if ('metaDescription' in body) data.metaDescription = strOrNull(body.metaDescription);
    if ('keywords' in body) data.keywords = strOrNull(body.keywords);
    if ('ogTitle' in body) data.ogTitle = strOrNull(body.ogTitle);
    if ('ogDescription' in body) data.ogDescription = strOrNull(body.ogDescription);
    if ('ogImage' in body) data.ogImage = strOrNull(body.ogImage);
    if (body.status === 'draft' || body.status === 'published') data.status = body.status;
    if ('publishedAt' in body) {
      data.publishedAt =
        typeof body.publishedAt === 'string' && body.publishedAt.trim()
          ? new Date(body.publishedAt)
          : null;
    }

    const doc = await prisma.blog.update({
      where: { slug: currentSlug },
      data,
    });

    await logMarketingActivity({
      userId: session.user.id,
      userEmail: session.user.email ?? '',
      userRole: session.user.role ?? '',
      entity: 'blog',
      entityId: doc.id,
      action: 'update',
      seoNote: strOrNull(body.seoNote),
      payload: {
        before: { slug: existing.slug, title: existing.title, status: existing.status },
        after: { slug: doc.slug, title: doc.title, status: doc.status },
      },
    });
    await logContentEdit({
      userId: session.user.id,
      userEmail: session.user.email ?? '',
      userRole: session.user.role ?? '',
      kind: 'blog',
      targetPath: doc.slug,
      summary: `update title length ${doc.title.length}, content length ${doc.content.length}`,
    });

    return NextResponse.json({ item: doc });
  } catch (error) {
    console.error('Marketer blog(slug) PATCH error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !allowMarketer(session)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { slug } = await params;
    const s = slug.trim();
    if (!s) return NextResponse.json({ message: 'Invalid slug' }, { status: 400 });

    await connectDb();
    const existing = await prisma.blog.findUnique({ where: { slug: s } });
    if (!existing) return NextResponse.json({ message: 'Blog not found' }, { status: 404 });

    await prisma.blog.delete({ where: { slug: s } });
    await logMarketingActivity({
      userId: session.user.id,
      userEmail: session.user.email ?? '',
      userRole: session.user.role ?? '',
      entity: 'blog',
      entityId: existing.id,
      action: 'delete',
      payload: { slug: existing.slug, title: existing.title },
    });
    await logContentEdit({
      userId: session.user.id,
      userEmail: session.user.email ?? '',
      userRole: session.user.role ?? '',
      kind: 'blog',
      targetPath: existing.slug,
      summary: 'delete',
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Marketer blog(slug) DELETE error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

