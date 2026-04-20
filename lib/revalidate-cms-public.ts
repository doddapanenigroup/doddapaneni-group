import { revalidatePath, revalidateTag } from 'next/cache';
import { routing } from '@/i18n/routing';
import { DEFAULT_LOCALE } from '@/i18n/locales';
import { publicPathForLocale } from '@/lib/public-path-with-locale';
import { newsArticlePath, newsSectorListPath } from '@/lib/news-paths';

/**
 * On-demand revalidation for public routes after marketer CMS writes.
 * Skips preview (`/preview/...`); those remain `force-dynamic` and are unaffected.
 * Best-effort: never throws; pairs with existing ISR `revalidate` on pages.
 */
export function revalidateCmsPublicSurfaces() {
  try {
    revalidatePath('/', 'page');
    revalidatePath('/news', 'page');
    revalidateTag('page-seo', 'page');
    for (const locale of routing.locales) {
      if (locale === DEFAULT_LOCALE) continue;
      revalidatePath(`/${locale}/news`, 'page');
    }
  } catch {
    /* revalidate is best-effort */
  }
}

type BlogPathArgs = {
  sectorSlug: string | null;
  articleSlug: string;
  previousSectorSlug?: string | null;
  previousArticleSlug?: string | null;
};

/**
 * Revalidates the canonical blog article, sector list, and legacy
 * `/{company}/{article}` path for all locales, including old slugs when
 * a post is moved or renamed.
 */
export function revalidateNewsPostPublicPaths(args: BlogPathArgs) {
  const { sectorSlug, articleSlug, previousSectorSlug, previousArticleSlug } = args;

  const pairs = new Map<string, { sector: string; article: string }>();
  if (sectorSlug) {
    pairs.set(`${sectorSlug}::${articleSlug}`, { sector: sectorSlug, article: articleSlug });
  }
  if (
    previousSectorSlug &&
    previousArticleSlug &&
    (previousSectorSlug !== sectorSlug || previousArticleSlug !== articleSlug)
  ) {
    pairs.set(`${previousSectorSlug}::${previousArticleSlug}`, {
      sector: previousSectorSlug,
      article: previousArticleSlug,
    });
  }

  try {
    for (const { sector, article } of pairs.values()) {
      for (const locale of routing.locales) {
        revalidatePath(publicPathForLocale(locale, newsArticlePath(sector, article)), 'page');
        revalidatePath(publicPathForLocale(locale, newsSectorListPath(sector)), 'page');
        revalidatePath(publicPathForLocale(locale, `/${sector}/${article}`), 'page');
      }
    }
  } catch {
    /* best-effort */
  }
}
