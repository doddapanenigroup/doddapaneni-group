import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import './globals.css';
import { fontBodyClassNames } from '@/app/fonts';
import { routing } from '@/i18n/routing';
import { getSiteOrigin } from '@/lib/site-origin';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';

/** `/{locale}` only (home) — used to preload hero image without triggering audits on other routes. */
function isLocaleHomePath(pathname: string): boolean {
  const p = pathname.replace(/\/$/, '') || '/';
  const parts = p.split('/').filter(Boolean);
  if (parts.length !== 1) return false;
  return (routing.locales as readonly string[]).includes(parts[0]!);
}

const siteOrigin = getSiteOrigin();

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: {
    default: 'Doddapaneni Group | Technology, Healthcare, Commerce & Infrastructure',
    template: '%s | Doddapaneni Group',
  },
  applicationName: 'Doddapaneni Group',
  description:
    'Corporate site for Doddapaneni Group: twelve operating divisions, group companies including DealsMedi and Dlsin, and offices in Telangana (India) and Florida (USA).',
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: '/logo.webp', type: 'image/webp', sizes: '48x48' },
      { url: '/logo.webp', type: 'image/webp', sizes: '96x96' },
      { url: '/logo.webp', type: 'image/webp', sizes: '192x192' },
    ],
    shortcut: [{ url: '/logo.webp', type: 'image/webp' }],
    apple: [{ url: '/logo.webp', type: 'image/webp', sizes: '180x180' }],
  },
  openGraph: {
    type: 'website',
    siteName: 'Doddapaneni Group',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@DoddapanenGroup',
  },
  verification: {
    google: 'hz1gnEwKPg6vepXcHuuze94PQ1z2V22paJkCNYdy3xY',
  },
};

export const viewport: Viewport = {
  themeColor: '#1e3a8a',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const h = await headers();
  const path = h.get('x-pathname') ?? '';
  const preloadHero = path ? isLocaleHomePath(path) : false;

  const gaDisabled =
    process.env.NEXT_PUBLIC_DISABLE_GA === '1' || process.env.NEXT_PUBLIC_DISABLE_GA === 'true';
  const gaId = gaDisabled
    ? ''
    : (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || 'G-H4S3KYSL13');
  return (
    <html lang={routing.defaultLocale} suppressHydrationWarning>
      <head>
        {preloadHero ? (
          <link
            rel="preload"
            href="/image.webp"
            as="image"
            type="image/webp"
            fetchPriority="high"
          />
        ) : null}
      </head>
      <body className={`${fontBodyClassNames} flex min-h-screen flex-col antialiased`}>
        {gaId ? <GoogleAnalytics measurementId={gaId} /> : null}
        {children}
      </body>
    </html>
  );
}
