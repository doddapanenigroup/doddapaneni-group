import { NextRequest, NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';

const LOCALE_SET = new Set<string>(routing.locales);

/** Same anti-cache values as `next.config.ts` HTML rule — belt-and-suspenders at the edge. */
const NO_STORE_HTML = 'private, no-store, no-cache, must-revalidate, max-age=0';

function applyNoStoreHeaders(res: NextResponse) {
  res.headers.set('Cache-Control', NO_STORE_HTML);
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
    applyNoStoreHeaders(res);
    return res;
  }

  if (first && !LOCALE_SET.has(first)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${routing.defaultLocale}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
    const res = NextResponse.redirect(url);
    applyNoStoreHeaders(res);
    return res;
  }

  const res = NextResponse.next();
  applyNoStoreHeaders(res);
  return res;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
