import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');
const DEFAULT_LOCALE = 'en';
const LOCALES = [
  'en', 'te', 'hi', 'es',
  'bn', 'mr', 'ta', 'gu', 'ur', 'kn', 'or', 'ml', 'pa', 'as', 'mai', 'sat', 'ks',
] as const;

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

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/blog', destination: '/news', permanent: true },
      { source: '/blog/:slug', destination: '/news/:slug', permanent: true },
      ...LOCALES
        .filter((loc) => loc !== DEFAULT_LOCALE)
        .flatMap((loc) => [
          { source: `/${loc}/blog`, destination: `/${loc}/news`, permanent: true as const },
          {
            source: `/${loc}/blog/:slug`,
            destination: `/${loc}/news/:slug`,
            permanent: true as const,
          },
        ]),
    ];
  },
  poweredByHeader: false,
  // Docker / VPS: produces .next/standalone for `node server.js` (see Dockerfile)
  output: 'standalone',
  // Prisma engine must stay external (local client lives under lib/prisma-generated)
  serverExternalPackages: ["@prisma/client", "prisma", "nodemailer"],
  turbopack: {
    root: process.cwd(),
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
    minimumCacheTTL: 3600,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Enable experimental features for better performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'framer-motion', 'next-intl'],
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
      // Cache static assets
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
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

export default withNextIntl(nextConfig);
