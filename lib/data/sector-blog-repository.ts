import { connectDb, prisma } from '@/lib/db';
import { routing } from '@/i18n/routing';
import { canonicalDivisionDisplayName } from '@/lib/company-divisions';
import { publishScheduledContent } from '@/lib/publish-scheduled';
import { publishedBlogWhere, publishedBlogWhereForSector } from '@/lib/data/published-blog';
import type { PublicSector } from '@/lib/data/sector-repository';
import {
  foldSlugForLooseMatch,
  matchesLooseArticleSegment,
  normalizeStoredNewsSlug,
} from '@/lib/news-slug-normalize';

/** URL segment may not match `News.slug` (spaces vs hyphens, legacy “-on-…” tweaks, etc.). */
function articleSlugLookupVariants(raw: string): string[] {
  const t = raw.trim();
  if (!t) return [];
  const set = new Set<string>();
  const addWithEdgeCases = (base: string) => {
    if (!base) return;
    set.add(base);
    const withoutOn = base.replace(/-on-/g, '-');
    if (withoutOn !== base) set.add(withoutOn);
    const withMoneyOn = base.replace(/-money-outdated-/g, '-money-on-outdated-');
    if (withMoneyOn !== base) set.add(withMoneyOn);
  };

  addWithEdgeCases(t);
  try {
    addWithEdgeCases(decodeURIComponent(t));
  } catch {
    /* ignore malformed sequences */
  }
  addWithEdgeCases(normalizeStoredNewsSlug(t));
  return [...set];
}

const sectorBlogPostSelect = {
  slug: true,
  title: true,
  content: true,
  featuredImage: true,
  publishedAt: true,
  metaTitle: true,
  metaDescription: true,
  keywords: true,
  ogTitle: true,
  ogDescription: true,
  ogImage: true,
  sector: { select: { slug: true, name: true } },
} as const;

export type PublishedSectorBlogPost = {
  /** Canonical URL segment (always `news.slug`). */
  slug: string;
  title: string;
  content: string;
  featuredImage: string | null;
  publishedAt: Date | null;
  metaTitle: string | null;
  metaDescription: string | null;
  keywords: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  sector: { slug: string; name: string };
};

export type SectorBlogCardRow = {
  slug: string;
  title: string;
  featuredImage: string | null;
  publishedAt: Date | null;
  metaDescription: string | null;
  ogDescription: string | null;
};

/**
 * Single published article under a sector URL (`/news/{sector}/{article}`).
 * Null when sector or post missing, or post does not belong to sector.
 * Public `/news` is English-only: always the canonical `News` row (locale argument ignored for content).
 */
export async function fetchPublishedSectorBlogPost(
  sectorSlug: string,
  blogSlug: string,
  _locale: string = routing.defaultLocale,
): Promise<PublishedSectorBlogPost | null> {
  await connectDb();
  const now = new Date();
  await publishScheduledContent(now);

  // Resolve by sector slug on the relation (do not require a separate sector preload).
  // This matches how URLs are built and avoids extra failure modes from `getPublicSectorBySlug`.
  const variants = articleSlugLookupVariants(blogSlug);
  let post = await prisma.news.findFirst({
    where: {
      ...publishedBlogWhere(now),
      sector: { slug: sectorSlug.trim().toLowerCase() },
      slug: { in: variants },
    },
    select: sectorBlogPostSelect,
  });

  if (!post) {
    const foldIn = foldSlugForLooseMatch(blogSlug);
    if (foldIn.length >= 2) {
      const sectorRow = await prisma.sector.findFirst({
        where: { slug: sectorSlug.trim().toLowerCase() },
        select: { id: true },
      });
      if (sectorRow) {
        const candidates = await prisma.news.findMany({
          where: publishedBlogWhereForSector(sectorRow.id, now),
          select: sectorBlogPostSelect,
        });
        const hits = candidates.filter((p) =>
          matchesLooseArticleSegment(blogSlug, p.slug, p.title),
        );
        if (hits.length === 1) post = hits[0];
      }
    }
  }

  if (!post) return null;
  const { sector: rel, ...base } = post;
  if (!rel) return null;

  const sectorPayload = {
    ...rel,
    name: canonicalDivisionDisplayName(rel.slug, rel.name),
  };
  return { ...base, sector: sectorPayload };
}

export type PublishedArticleRouteHint =
  | { status: 'missing' }
  | { status: 'no_sector'; canonicalNewsSlug: string }
  | { status: 'ok'; sectorSlug: string; canonicalNewsSlug: string };

/**
 * Where a published article “lives” in URL space. Used to fix
 * `/news/{wrong-sector}/{slug}` by redirecting to the canonical sector path (no DB deletes).
 */
export async function resolvePublishedArticleRoute(
  articleSlug: string,
  now: Date = new Date(),
): Promise<PublishedArticleRouteHint> {
  await connectDb();
  await publishScheduledContent(now);
  const variants = articleSlugLookupVariants(articleSlug);
  let row = await prisma.news.findFirst({
    where: {
      ...publishedBlogWhere(now),
      slug: { in: variants },
    },
    select: { slug: true, title: true, sector: { select: { slug: true } } },
  });
  if (!row) {
    const foldIn = foldSlugForLooseMatch(articleSlug);
    if (foldIn.length >= 2) {
      const candidates = await prisma.news.findMany({
        where: publishedBlogWhere(now),
        select: { slug: true, title: true, sector: { select: { slug: true } } },
      });
      const hits = candidates.filter((p) =>
        matchesLooseArticleSegment(articleSlug, p.slug, p.title),
      );
      if (hits.length === 1) row = hits[0];
    }
  }
  if (!row) return { status: 'missing' };
  const s = row.sector?.slug?.trim().toLowerCase();
  const canonicalNewsSlug = row.slug;
  if (!s) return { status: 'no_sector', canonicalNewsSlug };
  return { status: 'ok', sectorSlug: s, canonicalNewsSlug };
}

export async function listPublishedBlogsForSectorPage(args: {
  sector: PublicSector;
  page: number;
  pageSize: number;
  now: Date;
  /** Ignored: `/news` list uses canonical English fields only. */
  locale?: string;
}): Promise<{ rows: SectorBlogCardRow[]; total: number }> {
  await connectDb();
  const { sector, page, pageSize, now } = args;
  const where = publishedBlogWhereForSector(sector.id, now);
  const skip = (page - 1) * pageSize;

  const [total, rows] = await Promise.all([
    prisma.news.count({ where }),
    prisma.news.findMany({
      where,
      orderBy: [{ publishedAt: 'desc' }, { updatedAt: 'desc' }],
      skip,
      take: pageSize,
      select: {
        slug: true,
        title: true,
        featuredImage: true,
        publishedAt: true,
        metaDescription: true,
        ogDescription: true,
      },
    }),
  ]);

  const mapped: SectorBlogCardRow[] = rows.map((r) => ({
    slug: r.slug,
    title: r.title,
    featuredImage: r.featuredImage,
    publishedAt: r.publishedAt,
    metaDescription: r.metaDescription,
    ogDescription: r.ogDescription,
  }));

  return { rows: mapped, total };
}

const blogListWithSectorSelect = {
  slug: true,
  title: true,
  content: true,
  featuredImage: true,
  publishedAt: true,
  updatedAt: true,
  sector: { select: { slug: true, name: true } },
} as const;

export type BlogListRowWithSector = {
  slug: string;
  title: string;
  content: string;
  featuredImage: string | null;
  publishedAt: Date | null;
  updatedAt: Date;
  sector: { slug: string; name: string } | null;
};

/** All published posts with sector link — main `/news` index (DB is source of truth when rows exist). */
export async function listAllPublishedBlogsWithSector(now: Date): Promise<BlogListRowWithSector[]> {
  await connectDb();
  const rows = await prisma.news.findMany({
    where: publishedBlogWhere(now),
    orderBy: [{ publishedAt: 'desc' }, { updatedAt: 'desc' }],
    select: blogListWithSectorSelect,
  });
  return rows.map((r) => ({
    ...r,
    sector: r.sector
      ? {
          slug: r.sector.slug,
          name: canonicalDivisionDisplayName(r.sector.slug, r.sector.name),
        }
      : null,
  }));
}

const hubArticleFlexibleSelect = {
  slug: true,
  title: true,
  content: true,
  featuredImage: true,
  publishedAt: true,
  status: true,
  scheduledPublishAt: true,
  metaTitle: true,
  metaDescription: true,
  keywords: true,
  ogTitle: true,
  ogDescription: true,
  ogImage: true,
  sector: { select: { slug: true, name: true } },
} as const;

export type HubArticleFlexibleRow = {
  slug: string;
  title: string;
  content: string;
  featuredImage: string | null;
  publishedAt: Date | null;
  status: string;
  scheduledPublishAt: Date | null;
  metaTitle: string | null;
  metaDescription: string | null;
  keywords: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  sector: { slug: string; name: string } | null;
};

/** `/news/[slug]` metadata — published posts only, flexible URL segment. */
export async function fetchPublishedNewsForHubMetadataFlexible(
  segment: string,
  now: Date,
): Promise<HubArticleFlexibleRow | null> {
  await connectDb();
  await publishScheduledContent(now);
  const trimmed = segment.trim();
  if (!trimmed) return null;

  const pub = publishedBlogWhere(now);

  let row = await prisma.news.findFirst({
    where: { slug: trimmed, ...pub },
    select: hubArticleFlexibleSelect,
  });
  if (row) return row;

  const variants = articleSlugLookupVariants(trimmed);
  if (variants.length) {
    row = await prisma.news.findFirst({
      where: { slug: { in: variants }, ...pub },
      select: hubArticleFlexibleSelect,
    });
    if (row) return row;
  }

  if (foldSlugForLooseMatch(trimmed).length < 2) return null;

  const candidates = await prisma.news.findMany({
    where: pub,
    select: hubArticleFlexibleSelect,
  });
  const hits = candidates.filter((p) => matchesLooseArticleSegment(trimmed, p.slug, p.title));
  return hits.length === 1 ? hits[0] : null;
}

/**
 * `/news/[slug]` page — any post status (matches legacy `findUnique` + fallbacks for flexible paths).
 * Caller keeps published / scheduled gating and static JSON fallback.
 */
export async function fetchNewsRowForHubPageFlexible(segment: string): Promise<HubArticleFlexibleRow | null> {
  await connectDb();
  const trimmed = segment.trim();
  if (!trimmed) return null;

  let row = await prisma.news.findUnique({
    where: { slug: trimmed },
    select: hubArticleFlexibleSelect,
  });
  if (row) return row;

  const variants = articleSlugLookupVariants(trimmed);
  if (variants.length) {
    row = await prisma.news.findFirst({
      where: { slug: { in: variants } },
      select: hubArticleFlexibleSelect,
    });
    if (row) return row;
  }

  if (foldSlugForLooseMatch(trimmed).length < 2) return null;

  const candidates = await prisma.news.findMany({
    select: hubArticleFlexibleSelect,
  });
  const hits = candidates.filter((p) => matchesLooseArticleSegment(trimmed, p.slug, p.title));
  return hits.length === 1 ? hits[0] : null;
}
