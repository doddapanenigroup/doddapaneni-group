import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

type LayoutSeoRow = {
  title: string;
  metaTitle: string | null;
  metaDescription: string | null;
  keywords: string | null;
  canonicalUrl: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
} | null;

/**
 * Cached PageContent lookup for locale layout metadata.
 * Cuts repeated DB work on navigations and improves TTFB for warm paths.
 * Arguments are part of the cache key (see Next.js unstable_cache docs).
 */
export const getCachedLayoutPageSeo = unstable_cache(
  async (slug: string, locale: string): Promise<LayoutSeoRow> => {
    const nowIso = new Date().toISOString();
    try {
      return await prisma.pageContent.findFirst({
        where: {
          slug,
          locale,
          status: 'published',
          OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: nowIso } }],
        },
        select: {
          title: true,
          metaTitle: true,
          metaDescription: true,
          keywords: true,
          canonicalUrl: true,
          ogTitle: true,
          ogDescription: true,
          ogImage: true,
        },
      });
    } catch {
      return null;
    }
  },
  ['layout-page-seo'],
  { revalidate: 120, tags: ['page-seo'] },
);
