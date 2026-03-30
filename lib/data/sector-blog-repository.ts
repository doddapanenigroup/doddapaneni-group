import { cache } from 'react';
import { connectDb, prisma } from '@/lib/db';
import { routing } from '@/i18n/routing';
import { canonicalDivisionDisplayName } from '@/lib/company-divisions';
import { publishScheduledContent } from '@/lib/publish-scheduled';
import { publishedBlogWhere, publishedBlogWhereForSector } from '@/lib/data/published-blog';
import { getPublicSectorBySlug, type PublicSector } from '@/lib/data/sector-repository';

const sectorBlogPostSelect = {
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

const translationSelect = {
  title: true,
  content: true,
  metaTitle: true,
  metaDescription: true,
  ogTitle: true,
  ogDescription: true,
} as const;

export type PublishedSectorBlogPost = {
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
 * `locale` selects auto-translated copy when present (see `syncBlogTranslations`); falls back to English.
 */
export const fetchPublishedSectorBlogPost = cache(async function fetchPublishedSectorBlogPost(
  sectorSlug: string,
  blogSlug: string,
  locale: string = routing.defaultLocale,
): Promise<PublishedSectorBlogPost | null> {
  await connectDb();
  const now = new Date();
  await publishScheduledContent(now);

  const sector = await getPublicSectorBySlug(sectorSlug);
  if (!sector) return null;

  const post = await prisma.blog.findFirst({
    where: {
      slug: blogSlug.trim(),
      ...publishedBlogWhereForSector(sector.id, now),
    },
    select: {
      ...sectorBlogPostSelect,
      translations: {
        where: { locale },
        select: translationSelect,
        take: 1,
      },
    },
  });

  if (!post) return null;
  const tr = post.translations[0];
  const { translations: _t, sector: rel, ...base } = post;
  if (!rel) return null;
  const merged = {
    ...base,
    title: tr?.title ?? base.title,
    content: tr?.content ?? base.content,
    metaTitle: tr?.metaTitle ?? base.metaTitle,
    metaDescription: tr?.metaDescription ?? base.metaDescription,
    ogTitle: tr?.ogTitle ?? base.ogTitle,
    ogDescription: tr?.ogDescription ?? base.ogDescription,
  };

  const sectorPayload = {
    ...rel,
    name: canonicalDivisionDisplayName(rel.slug, rel.name),
  };
  return { ...merged, sector: sectorPayload };
});

export async function listPublishedBlogsForSectorPage(args: {
  sector: PublicSector;
  page: number;
  pageSize: number;
  now: Date;
  /** Request locale; uses `BlogTranslation` when available. */
  locale?: string;
}): Promise<{ rows: SectorBlogCardRow[]; total: number }> {
  await connectDb();
  const { sector, page, pageSize, now } = args;
  const locale = args.locale ?? routing.defaultLocale;
  const where = publishedBlogWhereForSector(sector.id, now);
  const skip = (page - 1) * pageSize;

  const [total, rows] = await Promise.all([
    prisma.blog.count({ where }),
    prisma.blog.findMany({
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
        translations: {
          where: { locale },
          select: {
            title: true,
            metaDescription: true,
            ogDescription: true,
          },
          take: 1,
        },
      },
    }),
  ]);

  const mapped: SectorBlogCardRow[] = rows.map((r) => {
    const tr = r.translations[0];
    return {
      slug: r.slug,
      title: tr?.title ?? r.title,
      featuredImage: r.featuredImage,
      publishedAt: r.publishedAt,
      metaDescription: tr?.metaDescription ?? r.metaDescription,
      ogDescription: tr?.ogDescription ?? r.ogDescription,
    };
  });

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
  const rows = await prisma.blog.findMany({
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
