import type { Metadata } from 'next';
import type { AbstractIntlMessages } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import CorporateHubShell from '@/components/corporate/CorporateHubShell';
import { routing } from '@/i18n/routing';
import { localeFromRouteParam } from '@/lib/locale-from-path';
import { getMessagesForLocale } from '@/lib/messages';

/** Pre-render all locale variants for static routes that compose with child `generateStaticParams`. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  const title = t('title');
  const description = t('description');

  return {
    title,
    description,
    icons: {
      icon: [
        { url: '/favicon-dg-16.png', type: 'image/png', sizes: '16x16' },
        { url: '/favicon-dg-32.png', type: 'image/png', sizes: '32x32' },
        { url: '/favicon-dg-48.png', type: 'image/png', sizes: '48x48' },
        { url: '/favicon-dg-64.png', type: 'image/png', sizes: '64x64' },
        { url: '/favicon-dg-192.png', type: 'image/png', sizes: '192x192' },
        { url: '/favicon-dg-512.png', type: 'image/png', sizes: '512x512' },
      ],
      shortcut: [{ url: '/favicon-dg-32.png', type: 'image/png', sizes: '32x32' }],
      apple: [{ url: '/favicon-dg-180.png', type: 'image/png', sizes: '180x180' }],
    },
    openGraph: {
      title,
      description,
      siteName: 'Doddapaneni Group',
      type: 'website',
    },
    other: { google: 'notranslate' },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: paramLocale } = await params;
  if (!routing.locales.includes(paramLocale as (typeof routing.locales)[number])) {
    notFound();
  }
  const locale = localeFromRouteParam(paramLocale);
  setRequestLocale(locale);

  const initialMessages = getMessagesForLocale(locale) as AbstractIntlMessages;

  return (
    <CorporateHubShell
      initialPathname=""
      initialLocale={locale}
      initialMessages={initialMessages}
    >
      {children}
    </CorporateHubShell>
  );
}
