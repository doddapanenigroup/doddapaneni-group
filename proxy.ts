import { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

const handleI18nRouting = createMiddleware(routing);

/**
 * Expose the incoming pathname on the request so server components can align locale/messages
 * without forcing the entire document to be dynamic (avoid `headers()` in root layout).
 * Next.js 16+ uses the `proxy` file convention (formerly `middleware`).
 */
export function proxy(request: NextRequest) {
  const nextHeaders = new Headers(request.headers);
  nextHeaders.set('x-pathname', request.nextUrl.pathname);
  return handleI18nRouting(new NextRequest(request, { headers: nextHeaders }));
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
