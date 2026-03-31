import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import { logMarketingActivity } from '@/lib/audit-log';
import { logContentEdit } from '@/lib/audit-log';
import { captureErrorToDb } from '@/lib/error-monitor';
import { allowMarketerModule } from '@/app/api/marketer/_permissions';
import { notifyContentPublished } from '@/lib/notify';
import { routing } from '@/i18n/routing';
import { scheduleBlogTranslationSync } from '@/lib/blog-translations-sync';
import { schedulingForbiddenIfScheduled } from '@/lib/features';

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

async function resolveSectorIdOrError(raw: unknown): Promise<
  { ok: true; sectorId: string } | { ok: false; status: number; message: string }
> {
  const sectorId = strOrNull(raw);
  if (!sectorId) {
    console.warn('[marketer/blog] missing sectorId on create', { raw });
    return { ok: false, status: 400, message: 'sectorId is required' };
  }
  const sector = await prisma.sector.findUnique({
    where: { id: sectorId },
    select: { id: true },
  });
  if (!sector) {
    console.warn('[marketer/blog] invalid sectorId on create', { sectorId });
    return { ok: false, status: 400, message: 'Invalid sectorId' };
  }
  return { ok: true, sectorId };
}

async function resolveSectorIdFilter(raw: unknown): Promise<
  { ok: true; sectorId: string | null } | { ok: false; status: number; message: string }
> {
  const sectorId = strOrNull(raw);
  if (!sectorId) return { ok: true, sectorId: null };
  const sector = await prisma.sector.findUnique({
    where: { id: sectorId },
    select: { id: true },
  });
  if (!sector) return { ok: false, status: 400, message: 'Invalid sectorId filter' };
  return { ok: true, sectorId };
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || !(await allowMarketerModule(session.user.role as any, 'blogs'))) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const status = strOrNull(url.searchParams.get('status'));
    const sectorIdFilter = await resolveSectorIdFilter(url.searchParams.get('sectorId'));
    if (!sectorIdFilter.ok) {
      return NextResponse.json({ message: sectorIdFilter.message }, { status: sectorIdFilter.status });
    }

    await connectDb();
    const blogs = await prisma.news.findMany({
      where: {
        ...(status === 'draft' || status === 'published' ? { status } : {}),
        ...(sectorIdFilter.sectorId ? { sectorId: sectorIdFilter.sectorId } : {}),
      },
      orderBy: [{ updatedAt: 'desc' }],
      include: {
        author: { select: { id: true, email: true, name: true } },
        sector: { select: { id: true, name: true, slug: true } },
      },
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
    const schedGate = await schedulingForbiddenIfScheduled(scheduledPublishAt);
    if (schedGate) return schedGate;

    await connectDb();
    const sectorResult = await resolveSectorIdOrError(body.sectorId);
    if (!sectorResult.ok) {
      return NextResponse.json({ message: sectorResult.message }, { status: sectorResult.status });
    }
    const doc = await prisma.news.create({
      data: {
        title,
        slug,
        content,
        sectorId: sectorResult.sectorId,
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
      payload: { title: doc.title, slug: doc.slug, status: doc.status, sectorId: doc.sectorId },
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
      scheduleBlogTranslationSync(doc.id);
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

