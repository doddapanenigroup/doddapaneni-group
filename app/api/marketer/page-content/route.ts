import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDb, prisma } from '@/lib/db';
import { logMarketingActivity } from '@/lib/audit-log';
import { logContentEdit } from '@/lib/audit-log';
import { captureErrorToDb } from '@/lib/error-monitor';
import { allowMarketerModule } from '@/app/api/marketer/_permissions';
import { notifyContentPublished } from '@/lib/notify';
import { schedulingForbiddenIfScheduled } from '@/lib/features';
import { revalidateCmsPublicSurfaces, revalidatePageContentPublicPaths } from '@/lib/revalidate-cms-public';

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
    if (!session?.user || !(await allowMarketerModule(session.user.role as any, 'pages'))) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const locale = strOrNull(url.searchParams.get('locale')) ?? undefined;
    const summary =
      url.searchParams.get('summary') === '1' || url.searchParams.get('summary') === 'true';

    await connectDb();
    if (summary) {
      const rows = await prisma.pageContent.findMany({
        where: locale ? { locale } : undefined,
        orderBy: [{ updatedAt: 'desc' }],
        select: {
          id: true,
          pageKey: true,
          slug: true,
          locale: true,
          title: true,
          status: true,
          scheduledPublishAt: true,
          metaTitle: true,
          metaDescription: true,
          keywords: true,
          canonicalUrl: true,
          ogTitle: true,
          ogDescription: true,
          ogImage: true,
          updatedAt: true,
        },
      });
      return NextResponse.json({
        items: rows.map((r) => ({
          id: r.id,
          pageKey: r.pageKey,
          slug: r.slug,
          locale: r.locale,
          title: r.title,
          status: r.status,
          scheduledPublishAt: r.scheduledPublishAt ? r.scheduledPublishAt.toISOString() : null,
          metaTitle: r.metaTitle,
          metaDescription: r.metaDescription,
          keywords: r.keywords,
          canonicalUrl: r.canonicalUrl,
          ogTitle: r.ogTitle,
          ogDescription: r.ogDescription,
          ogImage: r.ogImage,
          updatedAt: r.updatedAt.toISOString(),
        })),
      });
    }

    const rows = await prisma.pageContent.findMany({
      where: locale ? { locale } : undefined,
      orderBy: [{ updatedAt: 'desc' }],
    });

    return NextResponse.json({
      items: rows.map((r) => ({
        id: r.id,
        pageKey: r.pageKey,
        slug: r.slug,
        locale: r.locale,
        title: r.title,
        body: r.body,
        status: r.status,
        scheduledPublishAt: r.scheduledPublishAt ? r.scheduledPublishAt.toISOString() : null,
        metaTitle: r.metaTitle,
        metaDescription: r.metaDescription,
        keywords: r.keywords,
        canonicalUrl: r.canonicalUrl,
        ogTitle: r.ogTitle,
        ogDescription: r.ogDescription,
        ogImage: r.ogImage,
        updatedAt: r.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    await captureErrorToDb({
      error,
      request,
      statusCode: 500,
      context: 'marketer/page-content/GET',
      user: null,
    });
    console.error('Marketer page-content GET error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !(await allowMarketerModule(session.user.role as any, 'pages'))) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
    }

    const pageKey = strOrNull(body.pageKey);
    const slug = strOrNull(body.slug);
    const locale = strOrNull(body.locale) ?? 'en';
    const title = strOrNull(body.title);
    const content = typeof body.body === 'string' ? body.body : '';
    const seoNote = strOrNull(body.seoNote);
    const scheduledPublishAt = dateOrNull(body.scheduledPublishAt);
    const schedGate = await schedulingForbiddenIfScheduled(scheduledPublishAt);
    if (schedGate) return schedGate;

    const status =
      body.status === 'draft' || body.status === 'published'
        ? (body.status as 'draft' | 'published')
        : 'published';

    if (!pageKey || !slug || !title) {
      return NextResponse.json({ message: 'pageKey, slug and title are required' }, { status: 400 });
    }

    await connectDb();
    const doc = await prisma.pageContent.create({
      data: {
        pageKey,
        slug,
        locale,
        title,
        body: content,
        status,
        scheduledPublishAt,
        metaTitle: strOrNull(body.metaTitle),
        metaDescription: strOrNull(body.metaDescription),
        keywords: strOrNull(body.keywords),
        canonicalUrl: strOrNull(body.canonicalUrl),
        ogTitle: strOrNull(body.ogTitle),
        ogDescription: strOrNull(body.ogDescription),
        ogImage: strOrNull(body.ogImage),
      },
    });

    await logMarketingActivity({
      userId: session.user.id,
      userEmail: session.user.email ?? '',
      userRole: session.user.role ?? '',
      entity: 'page_content',
      entityId: doc.id,
      action: 'create',
      seoNote,
      payload: {
        pageKey: doc.pageKey,
        slug: doc.slug,
        locale: doc.locale,
        title: doc.title,
      },
    });
    await logContentEdit({
      userId: session.user.id,
      userEmail: session.user.email ?? '',
      userRole: session.user.role ?? '',
      kind: 'page_content',
      targetPath: `${doc.slug} (${doc.locale})`,
      summary: `create title length ${doc.title.length}, body length ${doc.body.length}`,
    });

    if (doc.status === 'published') {
      void notifyContentPublished({
        kind: 'page',
        locale: doc.locale,
        title: doc.title,
        slug: doc.slug,
        pageKey: doc.pageKey,
        actorUserId: session.user.id,
      }).catch(() => {});
    }

    revalidateCmsPublicSurfaces();
    revalidatePageContentPublicPaths({ slug: doc.slug });

    return NextResponse.json({
      item: {
        id: doc.id,
        pageKey: doc.pageKey,
        slug: doc.slug,
        locale: doc.locale,
        title: doc.title,
        body: doc.body,
        status: doc.status,
        scheduledPublishAt: doc.scheduledPublishAt ? doc.scheduledPublishAt.toISOString() : null,
        metaTitle: doc.metaTitle,
        metaDescription: doc.metaDescription,
        keywords: doc.keywords,
        canonicalUrl: doc.canonicalUrl,
        ogTitle: doc.ogTitle,
        ogDescription: doc.ogDescription,
        ogImage: doc.ogImage,
        updatedAt: doc.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    await captureErrorToDb({
      error,
      request,
      statusCode: 500,
      context: 'marketer/page-content/POST',
      user: null,
    });
    console.error('Marketer page-content POST error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

