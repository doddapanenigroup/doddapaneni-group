import { NextRequest, NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';

const LOCALE_SET = new Set<string>(routing.locales);

/** Match `next.config.ts`: bfcache-friendly document policy; edge still skips caching HTML. */
const DOCUMENT_CACHE_CONTROL = 'private, max-age=0, must-revalidate';

function applyDocumentCacheHeaders(res: NextResponse) {
  res.headers.set('Cache-Control', DOCUMENT_CACHE_CONTROL);
  res.headers.set('CDN-Cache-Control', 'private, no-store');
  res.headers.set('Surrogate-Control', 'no-store');
}

/**
 * Locale guard: every public page lives under `/{en|te|hi|es}/…`.
 * `/` redirects to `/en` (default). Paths missing a locale prefix get `/en` prepended.
 *
 * Next.js 16+ `proxy` convention (formerly `middleware`). Response headers only — safe for RSC.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];

  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = `/${routing.defaultLocale}`;
    const res = NextResponse.redirect(url);
    applyDocumentCacheHeaders(res);
    return res;
  }

  if (first && !LOCALE_SET.has(first)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${routing.defaultLocale}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
    const res = NextResponse.redirect(url);
    applyDocumentCacheHeaders(res);
    return res;
  }

  const res = NextResponse.next();
  applyDocumentCacheHeaders(res);
  return res;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
