import { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

const handleI18nRouting = createMiddleware(routing);

/** Same anti-cache values as `next.config.ts` HTML rule — belt-and-suspenders at the edge. */
const NO_STORE_HTML =
  'private, no-store, no-cache, must-revalidate, max-age=0';

/**
 * i18n redirects/rewrites only. Do not wrap the request with cloned headers — that breaks
 * Next.js Flight/RSC document responses (hard refresh can show raw `:HL[...]` / `0:{...}` text).
 * Next.js 16+ uses the `proxy` file convention (formerly `middleware`).
 *
 * We only set *response* headers here (safe). Appending `Cache-Control` on the outgoing response
 * helps proxies that ignore headers from `next.config` alone.
 */
export function proxy(request: NextRequest) {
  const res = handleI18nRouting(request);
  res.headers.set('Cache-Control', NO_STORE_HTML);
  res.headers.set('CDN-Cache-Control', 'private, no-store');
  res.headers.set('Surrogate-Control', 'no-store');
  return res;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
