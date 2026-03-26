import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import { logMarketingActivity } from '@/lib/audit-log';
import { logContentEdit } from '@/lib/audit-log';
import { captureErrorToDb } from '@/lib/error-monitor';
import { allowMarketerModule } from '@/app/api/marketer/_permissions';
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

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || !(await allowMarketerModule(session.user.role as any, 'blogs'))) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const status = strOrNull(url.searchParams.get('status'));

    await connectDb();
    const blogs = await prisma.blog.findMany({
      where: status === 'draft' || status === 'published' ? { status } : undefined,
      orderBy: [{ updatedAt: 'desc' }],
      include: { author: { select: { id: true, email: true, name: true } } },
    });
    return NextResponse.json({ items: blogs });
  } catch (error) {
    await captureErrorToDb({
      error,
      request: undefined,
      statusCode: 500,
      context: 'marketer/blog/GET',
      user: null,
    });
    console.error('Marketer blog GET error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
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

    const title = strOrNull(body.title);
    const slug = strOrNull(body.slug);
    const content = typeof body.content === 'string' ? body.content : '';
    if (!title || !slug || !content.trim()) {
      return NextResponse.json({ message: 'title, slug and content are required' }, { status: 400 });
    }

    const status = strOrNull(body.status);
    const publishedAt =
      body.publishedAt && typeof body.publishedAt === 'string' ? new Date(body.publishedAt) : null;
    const scheduledPublishAt = dateOrNull(body.scheduledPublishAt);

    await connectDb();
    const doc = await prisma.blog.create({
      data: {
        title,
        slug,
        content,
        featuredImage: strOrNull(body.featuredImage),
        authorId: session.user.id,
        status: status === 'published' ? 'published' : 'draft',
        publishedAt: publishedAt && !isNaN(publishedAt.getTime()) ? publishedAt : null,
        scheduledPublishAt,
        metaTitle: strOrNull(body.metaTitle),
        metaDescription: strOrNull(body.metaDescription),
        keywords: strOrNull(body.keywords),
        ogTitle: strOrNull(body.ogTitle),
        ogDescription: strOrNull(body.ogDescription),
        ogImage: strOrNull(body.ogImage),
      },
    });

    await logMarketingActivity({
      userId: session.user.id,
      userEmail: session.user.email ?? '',
      userRole: session.user.role ?? '',
      entity: 'blog',
      entityId: doc.id,
      action: 'create',
      seoNote: strOrNull(body.seoNote),
      payload: { title: doc.title, slug: doc.slug, status: doc.status },
    });
    await logContentEdit({
      userId: session.user.id,
      userEmail: session.user.email ?? '',
      userRole: session.user.role ?? '',
      kind: 'blog',
      targetPath: doc.slug,
      summary: `create title length ${doc.title.length}, content length ${doc.content.length}`,
    });

    if (doc.status === 'published') {
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
      context: 'marketer/blog/POST',
      user: null,
    });
    console.error('Marketer blog POST error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

