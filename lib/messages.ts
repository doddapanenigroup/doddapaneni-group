/**
 * Shared locale messages so server components can resolve strings by URL locale
 * (same approach as home/other pages: locale from URL, data from server).
 */
import en from '@/messages/en.json';
import te from '@/messages/te.json';
import hi from '@/messages/hi.json';
import es from '@/messages/es.json';
import divisionTopics from '@/messages/division-topics.json';
import companyForms from '@/messages/company-forms.json';

function mergeSharedMessages(localeMessages: Record<string, unknown>): Record<string, unknown> {
  const override = localeMessages.DivisionTopics as Record<string, unknown> | undefined;
  const companyFormsOverride = localeMessages.CompanyForms as Record<string, unknown> | undefined;
  return {
    ...localeMessages,
    DivisionTopics: {
      ...(divisionTopics as Record<string, unknown>),
      ...(override ?? {}),
    },
    CompanyForms: {
      ...(companyForms as Record<string, unknown>),
      ...(companyFormsOverride ?? {}),
    },
  };
}

export const messagesByLocale: Record<string, Record<string, unknown>> = {
  en: mergeSharedMessages(en as Record<string, unknown>),
  te: mergeSharedMessages(te as Record<string, unknown>),
  hi: mergeSharedMessages(hi as Record<string, unknown>),
  es: mergeSharedMessages(es as Record<string, unknown>),
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
