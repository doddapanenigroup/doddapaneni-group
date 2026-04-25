import { connectDb, prisma } from '@/lib/db';
import { routing } from '@/i18n/routing';
import { DEFAULT_LOCALE } from '@/i18n/locales';
import { translateText } from '@/lib/translate';
import { translateHtmlContent } from '@/lib/blog-html-translate';

/** Locales that receive machine translation from the canonical (default) post. */
export function translationTargetLocales(): string[] {
  return routing.locales.filter((l) => l !== DEFAULT_LOCALE);
}

export type CanonicalTranslationInput = {
  title: string;
  content: string;
  excerpt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
};

export type MachineTranslatedLocaleFields = {
  title: string;
  content: string;
  excerpt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
};

export type BlogTranslationSyncResult = {
  translatedLocales: string[];
  failedLocales: string[];
};

async function translateOptionalFast(str: string | null, targetLocale: string): Promise<string | null> {
  if (str == null) return null;
  const t = str.trim();
  if (!t) return null;
  return translateText(t, targetLocale, DEFAULT_LOCALE);
}

/**
 * Machine-translate canonical (English) fields into every non-default locale in parallel.
 * Does not touch the database.
 */
export async function machineTranslateCanonicalFields(
  fields: CanonicalTranslationInput,
): Promise<Record<string, MachineTranslatedLocaleFields>> {
  const targets = translationTargetLocales();
  const out: Record<string, MachineTranslatedLocaleFields> = {};
  for (const locale of targets) {
    try {
      const [title, metaTitle, metaDescription, ogTitle, ogDescription, excerpt, content] =
        await Promise.all([
          translateText(fields.title, locale, DEFAULT_LOCALE),
          translateOptionalFast(fields.metaTitle, locale),
          translateOptionalFast(fields.metaDescription, locale),
          translateOptionalFast(fields.ogTitle, locale),
          translateOptionalFast(fields.ogDescription, locale),
          translateOptionalFast(fields.excerpt, locale),
          translateHtmlContent(fields.content, locale, DEFAULT_LOCALE),
        ]);
      out[locale] = {
        title,
        content,
        excerpt,
        metaTitle,
        metaDescription,
        ogTitle,
        ogDescription,
      };
    } catch (e) {
      console.error(`[blog-translations] machineTranslateCanonicalFields locale=${locale}`, e);
    }
  }
  return out;
}

type CanonicalPostFields = CanonicalTranslationInput & { id: string };

/**
 * Upserts `NewsTranslation` rows from the canonical (default-locale) `News` fields.
 * Safe to call for drafts (previews) or published posts.
 */
export async function applyMachineTranslationsFromCanonicalPost(
  post: CanonicalPostFields,
): Promise<BlogTranslationSyncResult> {
  const byLocale = await machineTranslateCanonicalFields({
    title: post.title,
    content: post.content,
    excerpt: post.excerpt,
    metaTitle: post.metaTitle,
    metaDescription: post.metaDescription,
    ogTitle: post.ogTitle,
    ogDescription: post.ogDescription,
  });

  const translatedLocales: string[] = [];
  const failedLocales = translationTargetLocales().filter((locale) => !byLocale[locale]);

  for (const locale of translationTargetLocales()) {
    const payload = byLocale[locale];
    if (!payload) continue;
    try {
      await prisma.newsTranslation.upsert({
        where: {
          newsId_locale: { newsId: post.id, locale },
        },
        create: {
          newsId: post.id,
          locale,
          title: payload.title,
          content: payload.content,
          excerpt: payload.excerpt,
          metaTitle: payload.metaTitle,
          metaDescription: payload.metaDescription,
          ogTitle: payload.ogTitle,
          ogDescription: payload.ogDescription,
        },
        update: {
          title: payload.title,
          content: payload.content,
          excerpt: payload.excerpt,
          metaTitle: payload.metaTitle,
          metaDescription: payload.metaDescription,
          ogTitle: payload.ogTitle,
          ogDescription: payload.ogDescription,
        },
      });
      translatedLocales.push(locale);
    } catch (e) {
      console.error(`[blog-translations] upsert locale=${locale} newsId=${post.id}`, e);
      failedLocales.push(locale);
    }
  }
  return { translatedLocales, failedLocales: [...new Set(failedLocales)] };
}

/**
 * Fills or updates `NewsTranslation` rows from the canonical `News` row.
 * Set `BLOG_AUTO_TRANSLATE=0` to skip entirely.
 */
export async function syncBlogTranslations(newsId: string): Promise<void> {
  if (process.env.BLOG_AUTO_TRANSLATE === '0') {
    return;
  }

  await connectDb();
  const post = await prisma.news.findUnique({
    where: { id: newsId },
    select: {
      id: true,
      title: true,
      content: true,
      excerpt: true,
      metaTitle: true,
      metaDescription: true,
      ogTitle: true,
      ogDescription: true,
    },
  });
  if (!post) return;

  await applyMachineTranslationsFromCanonicalPost(post);
}

/**
 * Marketer-triggered full machine translate (draft or published). Respects `BLOG_AUTO_TRANSLATE=0`.
 */
export async function translateBlogPostByIdForMarketer(
  newsId: string,
): Promise<
  | { ok: true; locales: string[]; failedLocales: string[] }
  | { ok: false; message: string }
> {
  if (process.env.BLOG_AUTO_TRANSLATE === '0') {
    return { ok: false, message: 'Auto-translate is off (set BLOG_AUTO_TRANSLATE unset or non-zero).' };
  }

  await connectDb();
  const post = await prisma.news.findUnique({
    where: { id: newsId },
    select: {
      id: true,
      title: true,
      content: true,
      excerpt: true,
      metaTitle: true,
      metaDescription: true,
      ogTitle: true,
      ogDescription: true,
    },
  });
  if (!post) {
    return { ok: false, message: 'Post not found.' };
  }

  const result = await applyMachineTranslationsFromCanonicalPost(post);
  return { ok: true, locales: result.translatedLocales, failedLocales: result.failedLocales };
}

export function scheduleBlogTranslationSync(newsId: string): void {
  if (process.env.BLOG_AUTO_TRANSLATE === '0') return;
  void syncBlogTranslations(newsId).catch((e) => {
    console.error(`[blog-translations] scheduleBlogTranslationSync failed newsId=${newsId}`, e);
  });
}
