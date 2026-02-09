import createMiddleware from 'next-intl/middleware';
import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isDashboard = pathname.includes('/dashboard');
  const isApiAuth = pathname.startsWith('/api/auth');

  if (isDashboard && !isApiAuth) {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
    });
    if (!token) {
      const locale = pathname.split('/')[1] ?? routing.defaultLocale;
      const loginUrl = new URL(`/${locale}/login`, request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);
  const modifiedRequest = new NextRequest(request.url, { headers: requestHeaders });
  return intlMiddleware(modifiedRequest);
}

export const config = {
  matcher: ['/', '/(en|te|hi|es|bn|mr|ta|gu|ur|kn|or|ml|pa|as|mai|sat|ks)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
