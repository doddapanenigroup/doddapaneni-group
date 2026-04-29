import type { NextResponse } from 'next/server';

/** Canonical site is apex; `www` is listed so we can echo `Origin` when the CDN still serves API on `www`. */
const APEX_ORIGIN = 'https://doddapanenigroup.net';
const PRODUCTION_SITE_ORIGINS = new Set([APEX_ORIGIN, 'https://www.doddapanenigroup.net']);

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

/**
 * CORS for public / careers APIs when the edge still 301s `/api/*` apex → `www`: the final response is
 * cross-origin vs the apex page. Some browsers omit `Origin` on that redirected leg — then reflect
 * fails unless we fall back to the apex origin.
 */
export function corsHeadersForRequest(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin');
  if (origin && isAllowedSiteBrowserOrigin(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      Vary: 'Origin',
    };
  }
  if (!origin && process.env.NODE_ENV === 'production') {
    return {
      'Access-Control-Allow-Origin': APEX_ORIGIN,
      Vary: 'Origin',
    };
  }
  return {};
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
  const allowOrigin =
    origin && isAllowedSiteBrowserOrigin(origin)
      ? origin
      : !origin && process.env.NODE_ENV === 'production'
        ? APEX_ORIGIN
        : null;
  if (!allowOrigin) {
    return new Response(null, { status: 204 });
  }
  const h = new Headers();
  h.set('Access-Control-Allow-Origin', allowOrigin);
  h.set('Access-Control-Allow-Methods', opts.methods);
  h.set('Access-Control-Max-Age', '86400');
  h.set('Vary', 'Origin');
  const reqHdr = request.headers.get('Access-Control-Request-Headers');
  if (reqHdr) {
    h.set('Access-Control-Allow-Headers', reqHdr);
  }
  return new Response(null, { status: 204, headers: h });
}
