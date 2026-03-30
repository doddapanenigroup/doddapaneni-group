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
 * Fills or updates `BlogTranslation` rows from the canonical English `Blog` row.
 * Called after publish from the marketer API and when scheduled posts go live.
 * Set `BLOG_AUTO_TRANSLATE=0` to skip (English only in UI until re-enabled).
 */
export async function syncBlogTranslations(blogId: string): Promise<void> {
  if (process.env.BLOG_AUTO_TRANSLATE === '0') {
    return;
  }

  await connectDb();
  const blog = await prisma.blog.findUnique({ where: { id: blogId } });
  if (!blog) return;

  if (blog.status !== 'published') {
    await prisma.blogTranslation.deleteMany({ where: { blogId } });
    return;
  }

  for (const locale of translationTargets()) {
    try {
      const title = await translateText(blog.title, locale, SOURCE_LOCALE);
      await delay(DELAY_MS);

      const metaTitle = await translateOptional(blog.metaTitle, locale);
      const metaDescription = await translateOptional(blog.metaDescription, locale);
      const ogTitle = await translateOptional(blog.ogTitle, locale);
      const ogDescription = await translateOptional(blog.ogDescription, locale);

      const content = await translateHtmlContent(blog.content, locale, SOURCE_LOCALE);

      await prisma.blogTranslation.upsert({
        where: {
          blogId_locale: { blogId, locale },
        },
        create: {
          blogId,
          locale,
          title,
          content,
          metaTitle,
          metaDescription,
          ogTitle,
          ogDescription,
        },
        update: {
          title,
          content,
          metaTitle,
          metaDescription,
          ogTitle,
          ogDescription,
        },
      });
    } catch (e) {
      console.error(`[blog-translations] sync failed blogId=${blogId} locale=${locale}`, e);
    }
  }
}

export function scheduleBlogTranslationSync(blogId: string): void {
  if (process.env.BLOG_AUTO_TRANSLATE === '0') return;
  void syncBlogTranslations(blogId).catch((e) => {
    console.error(`[blog-translations] scheduleBlogTranslationSync failed blogId=${blogId}`, e);
  });
}
