import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { fontBodyClassNames } from '@/app/fonts';
import { routing } from '@/i18n/routing';
import { getSiteOrigin } from '@/lib/site-origin';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';

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
    google: "hz1gnEwKPg6vepXcHuuze94PQ1z2V22paJkCNYdy3xY",
  },
};

export const viewport: Viewport = {
  themeColor: '#1e3a8a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const gaDisabled =
    process.env.NEXT_PUBLIC_DISABLE_GA === '1' || process.env.NEXT_PUBLIC_DISABLE_GA === 'true';
  const gaId = gaDisabled
    ? ''
    : (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || 'G-H4S3KYSL13');
  return (
    <html lang={routing.defaultLocale} suppressHydrationWarning>
      <body className={`${fontBodyClassNames} flex min-h-screen flex-col antialiased`}>
        {gaId ? <GoogleAnalytics measurementId={gaId} /> : null}
        {children}
      </body>
    </html>
  );
}
