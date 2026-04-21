import { routing } from '@/i18n/routing';
import { DEFAULT_LOCALE } from '@/i18n/locales';

/** Path from site root, always starting with `/` (e.g. `/`, `/about`, `/software-it-ai/services`). */
export type SitemapPathname = string;

export function pathWithLocale(locale: string, pathname: string): string {
  const fixed = fixPathname(pathname);
  if (fixed === '/') {
    return locale === DEFAULT_LOCALE ? '/' : `/${locale}`;
  }
  if (locale === DEFAULT_LOCALE) {
    return fixed;
  }
  return `/${locale}${fixed}`;
}

function fixPathname(pathname: string): SitemapPathname {
  if (!pathname || pathname === '/') return '/';
  const withSlash = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return withSlash.replace(/\/+/g, '/');
}

export function absoluteUrlForLocale(origin: string, locale: string, pathname: string): string {
  const path = pathWithLocale(locale, fixPathname(pathname));
  if (path === '/') return `${origin}/`;
  return `${origin}${path}`;
}

/** hreflang map for a single logical pathname (all locales + x-default). */
export function alternateLanguagesForPathname(
  origin: string,
  pathname: string,
): Record<string, string> {
  const fixed = fixPathname(pathname);
  const map: Record<string, string> = {};
  for (const loc of routing.locales) {
    map[loc] = absoluteUrlForLocale(origin, loc, fixed);
  }
  map['x-default'] = absoluteUrlForLocale(origin, routing.defaultLocale, fixed);
  return map;
}
