import { prisma } from '@/lib/db';
import { routing } from '@/i18n/routing';
import type { TranslationPatch } from '@/lib/marketer-news-fields';

/**
 * Upserts `NewsTranslation` rows from marketer `translationPatches` (same semantics as PATCH).
 */
export async function applyNewsTranslationPatches(
  newsId: string,
  patches: TranslationPatch[],
  canonical: { title: string; content: string },
): Promise<void> {
  const defaultLocale = routing.defaultLocale;
  for (const p of patches) {
    if (p.locale === defaultLocale) continue;
    const row = await prisma.newsTranslation.findUnique({
      where: { newsId_locale: { newsId, locale: p.locale } },
    });
    const title = p.title ?? row?.title ?? canonical.title;
    const content = p.content ?? row?.content ?? canonical.content;
    await prisma.newsTranslation.upsert({
      where: { newsId_locale: { newsId, locale: p.locale } },
      create: {
        newsId,
        locale: p.locale,
        title,
        content,
        excerpt: p.excerpt ?? null,
        metaTitle: p.metaTitle ?? null,
        metaDescription: p.metaDescription ?? null,
        translatedSlug: p.translatedSlug ?? null,
        hreflangJson: p.hreflangJson ?? null,
      },
      update: {
        title: p.title !== undefined ? p.title : row?.title ?? canonical.title,
        content: p.content !== undefined ? p.content : row?.content ?? canonical.content,
        excerpt: p.excerpt !== undefined ? p.excerpt : row?.excerpt ?? null,
        metaTitle: p.metaTitle !== undefined ? p.metaTitle : row?.metaTitle ?? null,
        metaDescription:
          p.metaDescription !== undefined ? p.metaDescription : row?.metaDescription ?? null,
        translatedSlug: p.translatedSlug !== undefined ? p.translatedSlug : row?.translatedSlug ?? null,
        hreflangJson: p.hreflangJson !== undefined ? p.hreflangJson : row?.hreflangJson ?? null,
      },
    });
  }
}
