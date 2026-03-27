import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { connectDb, prisma } from '@/lib/db';
import { COMPANY_DIVISION_SLUGS } from '@/lib/company-divisions';
import { DIVISION_SUBPAGES } from '@/lib/company-division-subpages';
import { publishScheduledContent } from '@/lib/publish-scheduled';
import { getSiteOrigin } from '@/lib/site-origin';
import { sitemapEntry } from '@/lib/sitemap-build';
import { sitemapPathFromPageKey } from '@/lib/sitemap-paths';
import { listAllPublishedBlogsWithSector } from '@/lib/data/sector-blog-repository';

/**
 * ISR: sitemap reflects DB changes on a short interval without querying on every hit.
 * (Google does not need sub-minute freshness; 5 minutes balances DB load and indexing.)
 */
export const revalidate = 300;

type ChangeFreq = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;

/** Public marketing & legal URLs (default-locale paths; `sitemapEntry` adds locale alternates). */
const STATIC_ROUTES: { path: string; priority: number; changeFrequency: ChangeFreq }[] = [
  { path: '/', priority: 1, changeFrequency: 'weekly' },
  { path: '/about', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/services', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/blog', priority: 0.9, changeFrequency: 'daily' },
  { path: '/contact', priority: 0.85, changeFrequency: 'monthly' },
  { path: '/companies/dealsmedi', priority: 0.75, changeFrequency: 'monthly' },
  { path: '/companies/dlsin', priority: 0.75, changeFrequency: 'monthly' },
  { path: '/companies/janatha-mirror', priority: 0.75, changeFrequency: 'monthly' },
  { path: '/privacy-policy', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/disclaimer', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/faq', priority: 0.6, changeFrequency: 'monthly' },
];

function blogLastModified(post: { publishedAt: Date | null; updatedAt: Date }): Date {
  const p = post.publishedAt?.getTime() ?? 0;
  const u = post.updatedAt.getTime();
  return new Date(Math.max(p, u));
}

function publishedPageWhere(at: Date) {
  return {
    status: 'published' as const,
    locale: routing.defaultLocale,
    OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: at } }],
  };
}

/** Earliest time for division hubs when the row is missing from DB (stable `lastmod`, not “now”). */
const DIVISION_FALLBACK_CREATED = new Date('2020-01-01T00:00:00.000Z');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getSiteOrigin();
  const entries: MetadataRoute.Sitemap = [];
  const now = new Date();

  const pushStatic = (
    contentLastModByPath: Map<string, Date>,
    blogListingLastMod: Date | undefined,
  ) => {
    for (const r of STATIC_ROUTES) {
      let lastModified = contentLastModByPath.get(r.path) ?? now;
      if (r.path === '/blog' && blogListingLastMod) {
        lastModified = new Date(Math.max(lastModified.getTime(), blogListingLastMod.getTime()));
      }
      entries.push(
        sitemapEntry(origin, r.path, {
          lastModified,
          priority: r.priority,
          changeFrequency: r.changeFrequency,
        }),
      );
    }
  };

  try {
    await connectDb();
  } catch {
    pushStatic(new Map(), undefined);
    return entries;
  }

  try {
    await publishScheduledContent(now);
  } catch (err) {
    console.error('[sitemap] publishScheduledContent failed', err);
  }

  let blogRows: Awaited<ReturnType<typeof listAllPublishedBlogsWithSector>> = [];
  let pageRows: { pageKey: string; updatedAt: Date }[] = [];
  let sectorRows: { slug: string; createdAt: Date }[] = [];

  try {
    const [blogs, pages, sectors] = await Promise.all([
      listAllPublishedBlogsWithSector(now),
      prisma.pageContent.findMany({
        where: publishedPageWhere(now),
        select: { pageKey: true, updatedAt: true },
      }),
      prisma.sector.findMany({
        where: { slug: { in: [...COMPANY_DIVISION_SLUGS] } },
        select: { slug: true, createdAt: true },
      }),
    ]);
    blogRows = blogs;
    pageRows = pages;
    sectorRows = sectors;
  } catch (err) {
    console.error('[sitemap] database query failed', err);
    pushStatic(new Map(), undefined);
    return entries;
  }

  const contentLastModByPath = new Map<string, Date>();
  for (const row of pageRows) {
    const path = sitemapPathFromPageKey(row.pageKey);
    if (!path) continue;
    const prev = contentLastModByPath.get(path);
    const t = row.updatedAt.getTime();
    if (!prev || t > prev.getTime()) contentLastModByPath.set(path, row.updatedAt);
  }

  const blogListingLastMod =
    blogRows.length === 0
      ? undefined
      : new Date(Math.max(...blogRows.map((post) => blogLastModified(post).getTime())));

  pushStatic(contentLastModByPath, blogListingLastMod);

  const sectorBySlug = new Map(sectorRows.map((row) => [row.slug, row]));

  const hubLastMod = new Map<string, Date>();
  for (const slug of COMPANY_DIVISION_SLUGS) {
    const row = sectorBySlug.get(slug);
    hubLastMod.set(slug, row?.createdAt ?? DIVISION_FALLBACK_CREATED);
  }
  for (const post of blogRows) {
    const slug = post.sector?.slug;
    if (!slug) continue;
    const lm = blogLastModified(post);
    const prev = hubLastMod.get(slug);
    if (!prev || lm.getTime() > prev.getTime()) hubLastMod.set(slug, lm);
  }

  const seenPaths = new Set<string>();
  for (const s of STATIC_ROUTES) {
    seenPaths.add(s.path === '/' ? '/' : s.path);
  }

  /** All 12 division hubs and subpages — DB refines `lastmod`; routes exist even if seed is incomplete. */
  for (const slug of COMPANY_DIVISION_SLUGS) {
    const hubMod = hubLastMod.get(slug)!;

    const hubPath = `/${slug}`;
    if (!seenPaths.has(hubPath)) {
      seenPaths.add(hubPath);
      entries.push(
        sitemapEntry(origin, hubPath, {
          lastModified: hubMod,
          priority: 0.85,
          changeFrequency: 'weekly',
        }),
      );
    }

    for (const sub of DIVISION_SUBPAGES) {
      const path = `/${slug}/${sub}`;
      if (seenPaths.has(path)) continue;
      seenPaths.add(path);
      const pageMod = contentLastModByPath.get(path);
      const lastModified = new Date(Math.max(hubMod.getTime(), pageMod?.getTime() ?? 0));
      entries.push(
        sitemapEntry(origin, path, {
          lastModified,
          priority: 0.78,
          changeFrequency: 'monthly',
        }),
      );
    }
  }

  for (const post of blogRows) {
    const path = post.sector?.slug ? `/${post.sector.slug}/${post.slug}` : `/blog/${post.slug}`;
    if (seenPaths.has(path)) continue;
    seenPaths.add(path);
    entries.push(
      sitemapEntry(origin, path, {
        lastModified: blogLastModified(post),
        priority: post.sector?.slug ? 0.72 : 0.65,
        changeFrequency: 'monthly',
      }),
    );
  }

  entries.sort((a, b) => a.url.localeCompare(b.url));
  return entries;
}
