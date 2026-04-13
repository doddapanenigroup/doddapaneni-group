import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";
import { APP_LOCALES, DEFAULT_LOCALE } from './i18n/locales';

/** Stable Turbopack root (avoids picking a parent folder when multiple lockfiles exist). */
const turbopackRoot = path.dirname(fileURLToPath(import.meta.url));

const LOCALES = APP_LOCALES;

/** Legacy favicon filenames (old metadata); browsers/clients may still request them. */
const LEGACY_FAVICON_DG_SIZES = [16, 32, 48, 64, 180, 192, 512] as const;

function legacyFaviconRedirects(): NonNullable<
  Awaited<ReturnType<NonNullable<NextConfig['redirects']>>>
> {
  return [
    ...LEGACY_FAVICON_DG_SIZES.map((size) => ({
      source: `/favicon-dg-${size}.png`,
      destination: '/logo.webp',
      permanent: false as const,
    })),
  ];
}

/**
 * Legacy URL prefixes from older builds (not in `routing.locales`).
 * Permanent redirects into the default locale prefix (`/en/…`).
 */
const REMOVED_LOCALE_PREFIXES = [
  'bn',
  'mr',
  'ta',
  'gu',
  'ur',
  'kn',
  'or',
  'ml',
  'pa',
  'as',
  'mai',
  'sat',
  'ks',
] as const;

function removedLocaleRedirects(): NonNullable<
  Awaited<ReturnType<NonNullable<NextConfig['redirects']>>>
> {
  return REMOVED_LOCALE_PREFIXES.flatMap((loc) => [
    { source: `/${loc}`, destination: `/${DEFAULT_LOCALE}`, permanent: true as const },
    { source: `/${loc}/:path*`, destination: `/${DEFAULT_LOCALE}/:path*`, permanent: true as const },
  ]);
}

/** Allow next/image to optimize `/api/media/**` (absolute URLs need a matching pattern). */
function apiMediaRemotePatterns(): NonNullable<
  NonNullable<NextConfig['images']>['remotePatterns']
> {
  const seen = new Set<string>();
  const out: NonNullable<NonNullable<NextConfig['images']>['remotePatterns']> = [];
  const add = (hostname: string, protocol: 'https' | 'http' = 'https') => {
    const h = hostname.toLowerCase();
    if (!h || seen.has(h)) return;
    seen.add(h);
    out.push({ protocol, hostname: h, pathname: '/api/media/**' });
  };

  add('www.doddapanenigroup.net');
  add('doddapanenigroup.net');

  const raw = process.env.NEXTAUTH_URL?.trim();
  if (raw) {
    try {
      const u = new URL(raw);
      add(u.hostname, u.protocol === 'https:' ? 'https' : 'http');
    } catch {
      /* ignore */
    }
  }
  return out;
}

/**
 * When NEXT_PUBLIC_SITE_URL (or SITE_URL) is set, send one hop to that hostname
 * (www ↔ apex) so users and crawlers do not chain multiple redirects.
 */
function hostCanonicalRedirects(): NonNullable<
  Awaited<ReturnType<NonNullable<NextConfig['redirects']>>>
> {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.SITE_URL?.trim();
  if (!raw) return [];
  try {
    const u = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    const host = u.hostname.toLowerCase();
    if (host === 'localhost' || host.startsWith('127.') || host.endsWith('.local')) {
      return [];
    }
    const bare = host.startsWith('www.') ? host.slice(4) : host;
    const www = `www.${bare}`;
    if (host.startsWith('www.')) {
      return [
        {
          source: '/:path*',
          has: [{ type: 'host' as const, value: bare }],
          destination: `https://${host}/:path*`,
          permanent: true,
        },
      ];
    }
    return [
      {
        source: '/:path*',
        has: [{ type: 'host' as const, value: www }],
        destination: `https://${host}/:path*`,
        permanent: true,
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  async redirects() {
    return [
      ...legacyFaviconRedirects(),
      ...hostCanonicalRedirects(),
      ...removedLocaleRedirects(),
      { source: '/blog', destination: `/${DEFAULT_LOCALE}/news`, permanent: true },
      { source: '/blog/:slug', destination: `/${DEFAULT_LOCALE}/news/:slug`, permanent: true },
      { source: '/terms-conditions', destination: `/${DEFAULT_LOCALE}/terms`, permanent: true },
      { source: '/services', destination: `/${DEFAULT_LOCALE}`, permanent: true },
      ...LOCALES.flatMap((loc) => [
        { source: `/${loc}/blog`, destination: `/${loc}/news`, permanent: true as const },
        {
          source: `/${loc}/blog/:slug`,
          destination: `/${loc}/news/:slug`,
          permanent: true as const,
        },
        {
          source: `/${loc}/terms-conditions`,
          destination: `/${loc}/terms`,
          permanent: true as const,
        },
        { source: `/${loc}/services`, destination: `/${loc}`, permanent: true as const },
      ]),
    ];
  },
  poweredByHeader: false,
  // Docker / VPS: produces .next/standalone for `node server.js` (see Dockerfile)
  output: 'standalone',
  // Prisma engine must stay external (local client lives under lib/prisma-generated)
  serverExternalPackages: ["@prisma/client", "prisma", "nodemailer"],
  turbopack: {
    root: turbopackRoot,
  },
  /** Keeps `next.config` out of Turbopack NFT for routes that use `fs` + `process.cwd()` (e.g. developer file editor). */
  outputFileTracingExcludes: {
    "*": ["./next.config.ts", "./next.config.mjs", "./next.config.js"],
  },
  // Enable compression
  compress: true,
  // Optimize images
  images: {
    remotePatterns: [
      ...apiMediaRemotePatterns(),
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    // Allow hero LCP images to use quality=72 (used in `components/home/HomePage.tsx`).
    qualities: [72, 75],
    minimumCacheTTL: 3600,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Enable experimental features for better performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts'],
    validateRSCRequestHeaders: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      // `private` keeps shared/CDN caches from serving one user’s HTML to another. Avoid `no-store` on the
      // document so browsers can use the back/forward cache (bfcache). Edge still opts out via CDN-Cache-Control.
      {
        source: '/((?!api|_next|.*\\..*).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, max-age=0, must-revalidate',
          },
          { key: 'CDN-Cache-Control', value: 'private, no-store' },
          { key: 'Surrogate-Control', value: 'no-store' },
        ],
      },
      {
        source: '/api/media/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
      // Do not match .webp/.avif here — would also match /api/media/*.webp and break API caching.
      {
        source: '/:path*\\.(jpg|jpeg|png|gif|svg|ico|webp|avif)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Cache fonts
      {
        source: '/:path*\\.(woff|woff2|ttf|otf)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;
