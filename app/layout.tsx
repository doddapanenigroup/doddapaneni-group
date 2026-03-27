import type { Metadata, Viewport } from 'next';
import type { AbstractIntlMessages } from 'next-intl';
import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import './globals.css';
import { fontBodyClassNames } from '@/app/fonts';
import CorporateHubShell from '@/components/corporate/CorporateHubShell';
import { resolveAppLocaleFromPathname } from '@/lib/locale-from-path';
import { getMessagesForLocale } from '@/lib/messages';
import { getSiteOrigin } from '@/lib/site-origin';

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

export default async function RootLayout({ children }: { children: ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? '';
  const initialLocale = resolveAppLocaleFromPathname(pathname);
  const initialMessages = getMessagesForLocale(initialLocale) as AbstractIntlMessages;

  return (
    <html lang={initialLocale} suppressHydrationWarning>
      <body className={`${fontBodyClassNames} flex min-h-screen flex-col antialiased`}>
        <CorporateHubShell
          initialPathname={pathname}
          initialLocale={initialLocale}
          initialMessages={initialMessages}
        >
          {children}
        </CorporateHubShell>
      </body>
    </html>
  );
}
