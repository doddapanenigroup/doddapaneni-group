/**
 * Raw blog content by locale and slug (static JSON under `/content/translations`).
 */
import en from '@/content/translations/en.json';
import te from '@/content/translations/te.json';
import hi from '@/content/translations/hi.json';
import es from '@/content/translations/es.json';

type Messages = {
  Blog?: { posts?: Record<string, { content?: string }> };
};

const byLocale: Record<string, Messages> = {
  en: en as Messages,
  te: te as Messages,
  hi: hi as Messages,
  es: es as Messages,
};

export function getBlogContent(locale: string, slug: string): string {
  const messages = byLocale[locale] ?? byLocale.en;
  const content = messages?.Blog?.posts?.[slug]?.content;
  return typeof content === 'string' ? content : '';
}
