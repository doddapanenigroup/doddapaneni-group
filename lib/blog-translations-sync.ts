import { connectDb, prisma } from '@/lib/db';
import { routing } from '@/i18n/routing';
import { delay, translateText } from '@/lib/translate';
import { translateHtmlContent } from '@/lib/blog-html-translate';

const SOURCE_LOCALE = 'en' as const;
const DELAY_MS = Number(process.env.TRANSLATE_DELAY_MS) || 400;

function translationTargets(): string[] {
  return routing.locales.filter((l) => l !== SOURCE_LOCALE);
}

async function translateOptional(str: string | null, locale: string): Promise<string | null> {
  if (str == null) return null;
  const t = str.trim();
  if (!t) return null;
  const out = await translateText(t, locale, SOURCE_LOCALE);
  await delay(DELAY_MS);
  return out;
}

/**
 * Fills or updates `NewsTranslation` rows from the canonical English `News` row.
 * Called after publish from the marketer API and when scheduled posts go live.
 * Set `BLOG_AUTO_TRANSLATE=0` to skip (English only in UI until re-enabled).
 */
export async function syncBlogTranslations(newsId: string): Promise<void> {
  if (process.env.BLOG_AUTO_TRANSLATE === '0') {
    return;
  }

  await connectDb();
  const post = await prisma.news.findUnique({ where: { id: newsId } });
  if (!post) return;

  if (post.status !== 'published') {
    await prisma.newsTranslation.deleteMany({ where: { newsId } });
    return;
  }

  for (const locale of translationTargets()) {
    try {
      const title = await translateText(post.title, locale, SOURCE_LOCALE);
      await delay(DELAY_MS);

      const metaTitle = await translateOptional(post.metaTitle, locale);
      const metaDescription = await translateOptional(post.metaDescription, locale);
      const ogTitle = await translateOptional(post.ogTitle, locale);
      const ogDescription = await translateOptional(post.ogDescription, locale);
      const excerpt = await translateOptional(post.excerpt, locale);

      const content = await translateHtmlContent(post.content, locale, SOURCE_LOCALE);

      await prisma.newsTranslation.upsert({
        where: {
          newsId_locale: { newsId, locale },
        },
        create: {
          newsId,
          locale,
          title,
          content,
          excerpt,
          metaTitle,
          metaDescription,
          ogTitle,
          ogDescription,
        },
        update: {
          title,
          content,
          excerpt,
          metaTitle,
          metaDescription,
          ogTitle,
          ogDescription,
        },
      });
    } catch (e) {
      console.error(`[blog-translations] sync failed newsId=${newsId} locale=${locale}`, e);
    }
  }
}

export function scheduleBlogTranslationSync(newsId: string): void {
  if (process.env.BLOG_AUTO_TRANSLATE === '0') return;
  void syncBlogTranslations(newsId).catch((e) => {
    console.error(`[blog-translations] scheduleBlogTranslationSync failed newsId=${newsId}`, e);
  });
}
