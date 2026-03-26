import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import { logMarketingActivity } from '@/lib/audit-log';
import { logContentEdit } from '@/lib/audit-log';
import { captureErrorToDb } from '@/lib/error-monitor';
import { allowMarketerModule } from '@/app/api/marketer/_permissions';
import { writeAuditLog } from '@/lib/audit';
import { notifyContentPublished } from '@/lib/notify';
import { routing } from '@/i18n/routing';

function strOrNull(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t.length ? t : null;
}

function dateOrNull(v: unknown): Date | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  if (!t) return null;
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !(await allowMarketerModule(session.user.role as any, 'blogs'))) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { slug } = await params;
    await connectDb();
    const doc = await prisma.blog.findUnique({ where: { slug: slug.trim() } });
    if (!doc) return NextResponse.json({ message: 'Blog not found' }, { status: 404 });
    return NextResponse.json({ item: doc });
  } catch (error) {
    await captureErrorToDb({
      error,
      request: undefined,
      statusCode: 500,
      context: 'marketer/blog/[slug]/GET',
      user: null,
    });
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
    if (!session?.user?.id || !(await allowMarketerModule(session.user.role as any, 'blogs'))) {
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
    if ('scheduledPublishAt' in body) data.scheduledPublishAt = dateOrNull(body.scheduledPublishAt);
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

    if (existing.status !== 'published' && doc.status === 'published') {
      void notifyContentPublished({
        kind: 'blog',
        locale: routing.defaultLocale,
        title: doc.title,
        slug: doc.slug,
        actorUserId: session.user.id,
      }).catch(() => {});
    }

    return NextResponse.json({ item: doc });
  } catch (error) {
    await captureErrorToDb({
      error,
      request,
      statusCode: 500,
      context: 'marketer/blog/[slug]/PATCH',
      user: null,
    });
    console.error('Marketer blog(slug) PATCH error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !(await allowMarketerModule(session.user.role as any, 'blogs'))) {
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

    await writeAuditLog({
      request,
      actor: { id: session.user.id, email: session.user.email ?? null, role: session.user.role ?? null },
      action: 'content.blog.delete',
      targetType: 'Blog',
      targetId: existing.id,
      targetLabel: existing.slug,
      payload: { slug: existing.slug, title: existing.title },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    await captureErrorToDb({
      error,
      request: undefined,
      statusCode: 500,
      context: 'marketer/blog/[slug]/DELETE',
      user: null,
    });
    console.error('Marketer blog(slug) DELETE error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

