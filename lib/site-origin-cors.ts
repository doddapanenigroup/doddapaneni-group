import type { NextResponse } from 'next/server';

/** Canonical public origin only (`NEXT_PUBLIC_SITE_URL` default). `www` redirects to apex in `next.config.ts`. */
const PRODUCTION_SITE_ORIGINS = new Set(['https://doddapanenigroup.net']);

export function isAllowedSiteBrowserOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (PRODUCTION_SITE_ORIGINS.has(origin)) return true;
  if (process.env.NODE_ENV !== 'production') {
    try {
      const { hostname } = new URL(origin);
      return hostname === 'localhost' || hostname === '127.0.0.1';
    } catch {
      return false;
    }
  }
  return false;
}

/** Adds CORS when responses must be readable cross-origin (e.g. misconfigured edge redirects). Apex is canonical. */
export function corsHeadersForRequest(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin');
  if (!isAllowedSiteBrowserOrigin(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin!,
    Vary: 'Origin',
  };
}

export function withCors<T extends NextResponse>(response: T, request: Request): T {
  const extra = corsHeadersForRequest(request);
  for (const [k, v] of Object.entries(extra)) {
    response.headers.set(k, v);
  }
  return response;
}

export function handleCorsOptions(
  request: Request,
  opts: { methods: string },
): Response {
  const origin = request.headers.get('Origin');
  if (!isAllowedSiteBrowserOrigin(origin)) {
    return new Response(null, { status: 204 });
  }
  const h = new Headers();
  h.set('Access-Control-Allow-Origin', origin!);
  h.set('Access-Control-Allow-Methods', opts.methods);
  h.set('Access-Control-Max-Age', '86400');
  h.set('Vary', 'Origin');
  const reqHdr = request.headers.get('Access-Control-Request-Headers');
  if (reqHdr) {
    h.set('Access-Control-Allow-Headers', reqHdr);
  }
  return new Response(null, { status: 204, headers: h });
}
