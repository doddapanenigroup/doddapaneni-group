import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';

/** Path from site root, always starting with `/` (e.g. `/`, `/about`, `/software-it-ai/services`). */
export type SitemapPathname = string;

export function pathWithLocale(locale: string, pathname: string): string {
  const p = pathname === '/' ? '' : pathname;
  if (locale === routing.defaultLocale) {
    return p === '' ? '/' : pathname;
  }
  return p === '' ? `/${locale}` : `/${locale}${pathname}`;
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

export function sitemapEntry(
  origin: string,
  pathname: string,
  options: {
    lastModified?: Date;
    changeFrequency?: MetadataRoute.Sitemap[0]['changeFrequency'];
    priority?: number;
  } = {},
): MetadataRoute.Sitemap[0] {
  const fixed = fixPathname(pathname);
  const url = absoluteUrlForLocale(origin, routing.defaultLocale, fixed);

  return {
    url,
    lastModified: options.lastModified ?? new Date(),
    changeFrequency: options.changeFrequency ?? 'weekly',
    priority: options.priority,
    alternates: { languages: alternateLanguagesForPathname(origin, fixed) },
  };
}
