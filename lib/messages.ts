/**
 * Shared locale messages so server components can resolve strings by URL locale
 * (same approach as home/other pages: locale from URL, data from server).
 */
import en from '@/messages/en.json';
import te from '@/messages/te.json';
import hi from '@/messages/hi.json';
import es from '@/messages/es.json';
import bn from '@/messages/bn.json';
import mr from '@/messages/mr.json';
import ta from '@/messages/ta.json';
import gu from '@/messages/gu.json';
import ur from '@/messages/ur.json';
import kn from '@/messages/kn.json';
import or from '@/messages/or.json';
import ml from '@/messages/ml.json';
import pa from '@/messages/pa.json';
import as from '@/messages/as.json';
import mai from '@/messages/mai.json';
import sat from '@/messages/sat.json';
import ks from '@/messages/ks.json';

export const messagesByLocale: Record<string, Record<string, unknown>> = {
  en: en as Record<string, unknown>,
  te: te as Record<string, unknown>,
  hi: hi as Record<string, unknown>,
  es: es as Record<string, unknown>,
  bn: bn as Record<string, unknown>,
  mr: mr as Record<string, unknown>,
  ta: ta as Record<string, unknown>,
  gu: gu as Record<string, unknown>,
  ur: ur as Record<string, unknown>,
  kn: kn as Record<string, unknown>,
  or: or as Record<string, unknown>,
  ml: ml as Record<string, unknown>,
  pa: pa as Record<string, unknown>,
  as: as as Record<string, unknown>,
  mai: mai as Record<string, unknown>,
  sat: sat as Record<string, unknown>,
  ks: ks as Record<string, unknown>,
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
