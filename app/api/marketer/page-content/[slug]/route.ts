import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import { logMarketingActivity } from '@/lib/audit-log';
import { logContentEdit } from '@/lib/audit-log';
import { captureErrorToDb } from '@/lib/error-monitor';
import { allowMarketerModule } from '@/app/api/marketer/_permissions';
import { writeAuditLog } from '@/lib/audit';
import { notifyContentPublished } from '@/lib/notify';
import { schedulingForbiddenIfScheduled } from '@/lib/features';
import { revalidateCmsPublicSurfaces } from '@/lib/revalidate-cms-public';

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
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !(await allowMarketerModule(session.user.role as any, 'pages'))) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { slug } = await params;
    const locale = strOrNull(new URL(request.url).searchParams.get('locale')) ?? undefined;

    await connectDb();
    const doc = await prisma.pageContent.findFirst({
      where: { slug: slug.trim(), ...(locale ? { locale } : {}) },
    });
    if (!doc) return NextResponse.json({ message: 'Page content not found' }, { status: 404 });

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
      context: 'marketer/page-content/[slug]/GET',
      user: null,
    });
    console.error('Marketer page-content(slug) GET error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !(await allowMarketerModule(session.user.role as any, 'pages'))) {
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
    const existing = await prisma.pageContent.findUnique({ where: { slug: currentSlug } });
    if (!existing) return NextResponse.json({ message: 'Page content not found' }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (typeof body.pageKey === 'string' && body.pageKey.trim()) data.pageKey = body.pageKey.trim();
    if (typeof body.slug === 'string' && body.slug.trim()) data.slug = body.slug.trim();
    if (typeof body.locale === 'string' && body.locale.trim()) data.locale = body.locale.trim().toLowerCase();
    if (typeof body.title === 'string') data.title = body.title;
    if (typeof body.body === 'string') data.body = body.body;
    if (body.status === 'draft' || body.status === 'published') data.status = body.status;
    if ('scheduledPublishAt' in body) {
      const nextSched = dateOrNull(body.scheduledPublishAt);
      const schedGate = await schedulingForbiddenIfScheduled(nextSched);
      if (schedGate) return schedGate;
      data.scheduledPublishAt = nextSched;
    }
    if ('metaTitle' in body) data.metaTitle = strOrNull(body.metaTitle);
    if ('metaDescription' in body) data.metaDescription = strOrNull(body.metaDescription);
    if ('keywords' in body) data.keywords = strOrNull(body.keywords);
    if ('canonicalUrl' in body) data.canonicalUrl = strOrNull(body.canonicalUrl);
    if ('ogTitle' in body) data.ogTitle = strOrNull(body.ogTitle);
    if ('ogDescription' in body) data.ogDescription = strOrNull(body.ogDescription);
    if ('ogImage' in body) data.ogImage = strOrNull(body.ogImage);

    const doc = await prisma.pageContent.update({
      where: { slug: currentSlug },
      data,
    });

    await logMarketingActivity({
      userId: session.user.id,
      userEmail: session.user.email ?? '',
      userRole: session.user.role ?? '',
      entity: 'page_content',
      entityId: doc.id,
      action: 'update',
      seoNote: strOrNull(body.seoNote),
      payload: {
        before: {
          pageKey: existing.pageKey,
          slug: existing.slug,
          title: existing.title,
          locale: existing.locale,
        },
        after: {
          pageKey: doc.pageKey,
          slug: doc.slug,
          title: doc.title,
          locale: doc.locale,
        },
      },
    });
    await logContentEdit({
      userId: session.user.id,
      userEmail: session.user.email ?? '',
      userRole: session.user.role ?? '',
      kind: 'page_content',
      targetPath: `${doc.slug} (${doc.locale})`,
      summary: `update title length ${doc.title.length}, body length ${doc.body.length}`,
    });

    if (existing.status !== 'published' && doc.status === 'published') {
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

    return NextResponse.json({ ok: true, item: doc });
  } catch (error) {
    await captureErrorToDb({
      error,
      request,
      statusCode: 500,
      context: 'marketer/page-content/[slug]/PATCH',
      user: null,
    });
    console.error('Marketer page-content(slug) PATCH error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !(await allowMarketerModule(session.user.role as any, 'pages'))) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { slug } = await params;
    const s = slug.trim();
    if (!s) return NextResponse.json({ message: 'Invalid slug' }, { status: 400 });

    await connectDb();
    const existing = await prisma.pageContent.findUnique({ where: { slug: s } });
    if (!existing) return NextResponse.json({ message: 'Page content not found' }, { status: 404 });

    await prisma.pageContent.delete({ where: { slug: s } });
    await logMarketingActivity({
      userId: session.user.id,
      userEmail: session.user.email ?? '',
      userRole: session.user.role ?? '',
      entity: 'page_content',
      entityId: existing.id,
      action: 'delete',
      payload: { slug: existing.slug, pageKey: existing.pageKey, locale: existing.locale },
    });
    await logContentEdit({
      userId: session.user.id,
      userEmail: session.user.email ?? '',
      userRole: session.user.role ?? '',
      kind: 'page_content',
      targetPath: `${existing.slug} (${existing.locale})`,
      summary: 'delete',
    });

    await writeAuditLog({
      request,
      actor: { id: session.user.id, email: session.user.email ?? null, role: session.user.role ?? null },
      action: 'content.page_content.delete',
      targetType: 'PageContent',
      targetId: existing.id,
      targetLabel: `${existing.slug} (${existing.locale})`,
      payload: { slug: existing.slug, pageKey: existing.pageKey, locale: existing.locale },
    });

    revalidateCmsPublicSurfaces();

    return NextResponse.json({ ok: true });
  } catch (error) {
    await captureErrorToDb({
      error,
      request: undefined,
      statusCode: 500,
      context: 'marketer/page-content/[slug]/DELETE',
      user: null,
    });
    console.error('Marketer page-content(slug) DELETE error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

