import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDb, prisma } from '@/lib/db';
import { logMarketingActivity } from '@/lib/audit-log';
import { logContentEdit } from '@/lib/audit-log';
import { captureErrorToDb } from '@/lib/error-monitor';
import { allowMarketerModule } from '@/app/api/marketer/_permissions';
import { notifyContentPublished } from '@/lib/notify';
import { routing } from '@/i18n/routing';
import { applyNewsTranslationPatches } from '@/lib/news-apply-translation-patches';
import { schedulingForbiddenIfScheduled } from '@/lib/features';
import {
  estimateReadingMinutesFromHtml,
  parseContentType,
  parseNewsStatus,
  parseTranslationPatches,
} from '@/lib/marketer-news-fields';
import { revalidateCmsPublicSurfaces, revalidateNewsPostPublicPaths } from '@/lib/revalidate-cms-public';
import { Prisma } from '@/lib/prisma-generated';
import { isNewsSlugUniqueViolation } from '@/lib/prisma-news-unique';
import { scheduleBlogTranslationSync } from '@/lib/blog-translations-sync';
import { normalizeStoredNewsSlug } from '@/lib/news-slug-normalize';

/** List view: omit heavy HTML bodies so the dashboard can load many posts without huge JSON or OOM/timeouts. */
const marketerNewsListSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  featuredImage: true,
  featuredImageAlt: true,
  bannerImage: true,
  galleryImageUrls: true,
  embeddedVideoUrl: true,
  infographicUrls: true,
  authorId: true,
  authorDisplayName: true,
  authorBio: true,
  sectorId: true,
  status: true,
  publishedAt: true,
  scheduledPublishAt: true,
  metaTitle: true,
  metaDescription: true,
  keywords: true,
  focusKeyword: true,
  secondaryKeywords: true,
  canonicalUrl: true,
  breadcrumbTitle: true,
  metaRobots: true,
  categorySlugs: true,
  tags: true,
  subCategory: true,
  contentType: true,
  ogTitle: true,
  ogDescription: true,
  ogImage: true,
  viewCount: true,
  likeCount: true,
  shareCount: true,
  commentsEnabled: true,
  readingTimeMinutes: true,
  articleSchemaJson: true,
  faqSchemaJson: true,
  howToSchemaJson: true,
  relatedPostSlugs: true,
  pillarSlug: true,
  outboundLinksJson: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { id: true, email: true, name: true } },
  sector: { select: { id: true, name: true, slug: true } },
  translations: {
    select: {
      id: true,
      newsId: true,
      locale: true,
      title: true,
      excerpt: true,
      translatedSlug: true,
      hreflangJson: true,
      metaTitle: true,
      metaDescription: true,
      ogTitle: true,
      ogDescription: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} satisfies Prisma.NewsSelect;

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

    await connectDb();

    const url = new URL(request.url);
    const status = strOrNull(url.searchParams.get('status'));
    const sectorIdFilter = await resolveSectorIdFilter(url.searchParams.get('sectorId'));
    if (!sectorIdFilter.ok) {
      return NextResponse.json({ message: sectorIdFilter.message }, { status: sectorIdFilter.status });
    }

    const blogs = await prisma.news.findMany({
      where: {
        ...(status === 'draft' ||
        status === 'published' ||
        status === 'scheduled' ||
        status === 'archived'
          ? { status: status as 'draft' | 'published' | 'scheduled' | 'archived' }
          : {}),
        ...(sectorIdFilter.sectorId ? { sectorId: sectorIdFilter.sectorId } : {}),
      },
      orderBy: [{ updatedAt: 'desc' }],
      select: marketerNewsListSelect,
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
    return NextResponse.json(
      process.env.NODE_ENV === 'development' && error instanceof Error
        ? { message: 'Server error', debug: error.message }
        : { message: 'Server error' },
      { status: 500 },
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

    const title = strOrNull(body.title);
    const rawSlug = strOrNull(body.slug);
    const slug = rawSlug ? normalizeStoredNewsSlug(rawSlug) : null;
    const articleBody = typeof body.content === 'string' ? body.content : '';
    if (!title || !slug || !articleBody.trim()) {
      return NextResponse.json(
        { message: !slug && rawSlug ? 'slug must produce a non-empty URL segment after normalization' : 'title, slug and content are required' },
        { status: 400 },
      );
    }

    /** Default published so dashboard-created posts appear on public `/news/{sector}` without an extra save. */
    const parsedStatus = parseNewsStatus(body.status) ?? 'published';
    const publishedAt =
      body.publishedAt && typeof body.publishedAt === 'string' ? new Date(body.publishedAt) : null;
    const scheduledPublishAt = dateOrNull(body.scheduledPublishAt);
    const schedGate = await schedulingForbiddenIfScheduled(scheduledPublishAt);
    if (schedGate) return schedGate;

    if (parsedStatus === 'scheduled' && !scheduledPublishAt) {
      return NextResponse.json(
        { message: 'scheduled status requires scheduledPublishAt' },
        { status: 400 },
      );
    }

    await connectDb();
    const sectorResult = await resolveSectorIdOrError(body.sectorId);
    if (!sectorResult.ok) {
      return NextResponse.json({ message: sectorResult.message }, { status: sectorResult.status });
    }

    const contentType = parseContentType(body.contentType) ?? 'blog';

    const doc = await prisma.news.create({
      data: {
        title,
        slug,
        content: articleBody,
        excerpt: strOrNull(body.excerpt),
        sectorId: sectorResult.sectorId,
        featuredImage: strOrNull(body.featuredImage),
        featuredImageAlt: strOrNull(body.featuredImageAlt),
        bannerImage: strOrNull(body.bannerImage),
        galleryImageUrls: strOrNull(body.galleryImageUrls),
        embeddedVideoUrl: strOrNull(body.embeddedVideoUrl),
        infographicUrls: strOrNull(body.infographicUrls),
        authorId: session.user.id,
        authorDisplayName: strOrNull(body.authorDisplayName),
        authorBio: strOrNull(body.authorBio),
        status: parsedStatus,
        publishedAt:
          parsedStatus === 'published' && publishedAt && !isNaN(publishedAt.getTime())
            ? publishedAt
            : parsedStatus === 'published'
              ? new Date()
              : null,
        scheduledPublishAt,
        metaTitle: strOrNull(body.metaTitle),
        metaDescription: strOrNull(body.metaDescription),
        keywords: strOrNull(body.keywords),
        focusKeyword: strOrNull(body.focusKeyword),
        secondaryKeywords: strOrNull(body.secondaryKeywords),
        canonicalUrl: strOrNull(body.canonicalUrl),
        breadcrumbTitle: strOrNull(body.breadcrumbTitle),
        metaRobots: strOrNull(body.metaRobots),
        categorySlugs: strOrNull(body.categorySlugs),
        tags: strOrNull(body.tags),
        subCategory: strOrNull(body.subCategory),
        contentType,
        ogTitle: strOrNull(body.ogTitle),
        ogDescription: strOrNull(body.ogDescription),
        ogImage: strOrNull(body.ogImage),
        commentsEnabled: body.commentsEnabled === false ? false : true,
        articleSchemaJson: strOrNull(body.articleSchemaJson),
        faqSchemaJson: strOrNull(body.faqSchemaJson),
        howToSchemaJson: strOrNull(body.howToSchemaJson),
        relatedPostSlugs: strOrNull(body.relatedPostSlugs),
        pillarSlug: strOrNull(body.pillarSlug),
        outboundLinksJson: strOrNull(body.outboundLinksJson),
        readingTimeMinutes: estimateReadingMinutesFromHtml(articleBody),
      },
      include: {
        author: { select: { id: true, email: true, name: true } },
        sector: { select: { id: true, name: true, slug: true } },
        translations: true,
      },
    });

    const patches = parseTranslationPatches(body);
    try {
      await applyNewsTranslationPatches(doc.id, patches, { title: doc.title, content: doc.content });
    } catch (e) {
      // Do not fail article creation if locale patch rows fail.
      console.error(`[marketer/blog] create translation patch failed newsId=${doc.id}`, e);
    }

    let out = doc;
    const refetch = patches.length > 0;

    if (refetch) {
      const full = await prisma.news.findUnique({
        where: { id: doc.id },
        include: {
          author: { select: { id: true, email: true, name: true } },
          sector: { select: { id: true, name: true, slug: true } },
          translations: true,
        },
      });
      if (full) out = full;
    }

    // Fire-and-forget translation sync so save/create returns quickly for UI.
    scheduleBlogTranslationSync(doc.id);

    await Promise.all([
      logMarketingActivity({
        userId: session.user.id,
        userEmail: session.user.email ?? '',
        userRole: session.user.role ?? '',
        entity: 'blog',
        entityId: doc.id,
        action: 'create',
        seoNote: strOrNull(body.seoNote),
        payload: { title: doc.title, slug: doc.slug, status: doc.status, sectorId: doc.sectorId },
      }),
      logContentEdit({
        userId: session.user.id,
        userEmail: session.user.email ?? '',
        userRole: session.user.role ?? '',
        kind: 'blog',
        targetPath: doc.slug,
        summary: `create title length ${doc.title.length}, content length ${doc.content.length}`,
      }),
    ]);

    if (doc.status === 'published') {
      void notifyContentPublished({
        kind: 'blog',
        locale: routing.defaultLocale,
        title: doc.title,
        slug: doc.slug,
        actorUserId: session.user.id,
      }).catch(() => {});
    }

    revalidateCmsPublicSurfaces();
    revalidateNewsPostPublicPaths({
      sectorSlug: doc.sector?.slug ?? null,
      articleSlug: doc.slug,
    });

    return NextResponse.json({ item: out });
  } catch (error) {
    if (isNewsSlugUniqueViolation(error)) {
      return NextResponse.json(
        { message: 'A blog with this slug already exists. Change the slug and try again.' },
        { status: 409 },
      );
    }
    await captureErrorToDb({
      error,
      request,
      statusCode: 500,
      context: 'marketer/blog/POST',
      user: null,
    });
    console.error('Marketer blog POST error:', error);
    return NextResponse.json(
      process.env.NODE_ENV === 'development' && error instanceof Error
        ? { message: 'Server error', debug: error.message }
        : { message: 'Server error' },
      { status: 500 },
    );
  }
}

