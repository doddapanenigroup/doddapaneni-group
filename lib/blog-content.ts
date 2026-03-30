/**
 * Raw blog content by locale and slug. Used to avoid passing HTML through next-intl
 * formatter (which treats <p> etc. as rich text placeholders).
 */
import en from '@/messages/en.json';
import te from '@/messages/te.json';
import hi from '@/messages/hi.json';
import es from '@/messages/es.json';

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
