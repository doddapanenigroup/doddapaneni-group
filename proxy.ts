import { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

const handleI18nRouting = createMiddleware(routing);

/**
 * i18n redirects/rewrites only. Do not wrap the request with cloned headers — that breaks
 * Next.js Flight/RSC document responses (hard refresh can show raw `:HL[...]` / `0:{...}` text).
 * Next.js 16+ uses the `proxy` file convention (formerly `middleware`).
 */
export function proxy(request: NextRequest) {
  return handleI18nRouting(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
