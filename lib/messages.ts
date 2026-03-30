/**
 * Shared locale messages so server components can resolve strings by URL locale
 * (same approach as home/other pages: locale from URL, data from server).
 */
import en from '@/messages/en.json';
import te from '@/messages/te.json';
import hi from '@/messages/hi.json';
import es from '@/messages/es.json';

export const messagesByLocale: Record<string, Record<string, unknown>> = {
  en: en as Record<string, unknown>,
  te: te as Record<string, unknown>,
  hi: hi as Record<string, unknown>,
  es: es as Record<string, unknown>,
};

export function getMessagesForLocale(locale: string): Record<string, unknown> {
  return messagesByLocale[locale] ?? messagesByLocale.en;
}

export type BlogMessages = {
  title: string;
  subtitle: string;
  /** Optional editorial note on listing pages (AdSense / trust signals). */
  intro?: string;
  readMore: string;
  backToBlog: string;
  relatedPosts?: string;
  categories?: string;
  recentPosts?: string;
  posts: Record<
    string,
    { title: string; excerpt: string; category: string; readTime: string; content?: string }
  >;
};

export function getBlogMessages(locale: string): BlogMessages | null {
  const messages = getMessagesForLocale(locale);
  const blog = messages?.Blog;
  if (blog && typeof blog === 'object' && blog !== null && 'posts' in blog) {
    return blog as unknown as BlogMessages;
  }
  return null;
}
