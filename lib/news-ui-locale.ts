import { DEFAULT_LOCALE } from '@/i18n/locales';

/**
 * Pass as i18n `Link` `locale` for every public `/news/…` URL so Hindi (etc.) users
 * open English-only news routes (`/news`, not `/hi/news`).
 */
export const NEWS_PUBLIC_LINK_LOCALE = DEFAULT_LOCALE;
