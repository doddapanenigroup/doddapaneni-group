import { DEFAULT_LOCALE } from '@/i18n/locales';

/**
 * Browser-facing path: default locale (English) has no `/{locale}` prefix.
 * Other locales use `/{locale}` + path (e.g. `/te/about`).
 */
export function publicPathForLocale(locale: string, pathname: string): string {
  const p =
    !pathname || pathname === '/'
      ? '/'
      : pathname.startsWith('/')
        ? pathname
        : `/${pathname}`;
  if (locale === DEFAULT_LOCALE) {
    return p;
  }
  return p === '/' ? `/${locale}` : `/${locale}${p}`;
}

/** Join path segments after the (optional) locale prefix, e.g. `('te','news','slug')` → `/te/news/slug`. */
export function publicPathWithLocale(locale: string, ...segments: string[]): string {
  const path = `/${segments.filter(Boolean).join('/')}`;
  return publicPathForLocale(locale, path);
}
