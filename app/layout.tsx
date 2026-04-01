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
  openGraph: {
    type: 'website',
    siteName: 'Doddapaneni Group',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@DoddapanenGroup',
  },
};

export const viewport: Viewport = {
  themeColor: '#1e3a8a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || 'G-H4S3KYSL13';
  return (
    <html lang={routing.defaultLocale} suppressHydrationWarning>
      <body className={`${fontBodyClassNames} flex min-h-screen flex-col antialiased`}>
        <GoogleAnalytics measurementId={gaId} />
        {children}
      </body>
    </html>
  );
}
