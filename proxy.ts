import { NextRequest, NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';
import { DEFAULT_LOCALE } from '@/i18n/locales';
import { isCompanyDivisionSlug } from '@/lib/company-divisions';

/** Locales that appear in the visible URL (`en` is prefixless). */
const PREFIX_LOCALE_SET: Set<string> = new Set(
  routing.locales.filter((l) => l !== DEFAULT_LOCALE),
);

/** Match `next.config.ts`: bfcache-friendly document policy; edge still skips caching HTML. */
const DOCUMENT_CACHE_CONTROL = 'private, max-age=0, must-revalidate';

function applyDocumentCacheHeaders(res: NextResponse) {
  res.headers.set('Cache-Control', DOCUMENT_CACHE_CONTROL);
  res.headers.set('CDN-Cache-Control', 'private, no-store');
  res.headers.set('Surrogate-Control', 'no-store');
}

/**
 * Locale routing: English URLs have no `/en` prefix (`/`, `/about`, `/login`, …).
 * Telugu, Hindi, Spanish use `/te`, `/hi`, `/es` prefixes.
 * Unprefixed paths rewrite internally to `/{DEFAULT_LOCALE}/…` for `app/[locale]/…`.
 * Legacy `/en/…` redirects to the same path without `/en` (308).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];
  const isPrefixedLocale = !!first && PREFIX_LOCALE_SET.has(first);
  const restSegments = isPrefixedLocale ? segments.slice(1) : segments;
  const localePrefix = isPrefixedLocale ? first : null;

  // Legacy division services URL -> keyword URL, e.g. `/digital-marketing/services` -> `/digital-marketing-services`.
  if (
    restSegments.length === 2 &&
    restSegments[1] === 'services' &&
    isCompanyDivisionSlug(restSegments[0])
  ) {
    const url = request.nextUrl.clone();
    url.pathname = localePrefix
      ? `/${localePrefix}/${restSegments[0]}-services`
      : `/${restSegments[0]}-services`;
    const res = NextResponse.redirect(url, 308);
    applyDocumentCacheHeaders(res);
    return res;
  }

  if (first === DEFAULT_LOCALE) {
    const rest = segments.slice(1);
    const targetPath = rest.length ? `/${rest.join('/')}` : '/';
    const url = request.nextUrl.clone();
    url.pathname = targetPath;
    const res = NextResponse.redirect(url, 308);
    applyDocumentCacheHeaders(res);
    return res;
  }

  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}`;
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-pathname', '/');
    const res = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    applyDocumentCacheHeaders(res);
    return res;
  }

  if (first && PREFIX_LOCALE_SET.has(first)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-pathname', pathname);
    const res = NextResponse.next({ request: { headers: requestHeaders } });
    applyDocumentCacheHeaders(res);
    return res;
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);
  const res = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  applyDocumentCacheHeaders(res);
  return res;
}

export const config = {
  /**
   * Skip Next internals, API, and paths whose first segment contains a dot
   * (`/robots.txt`, static assets) so locale rewrites never turn them into HTML.
   */
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
