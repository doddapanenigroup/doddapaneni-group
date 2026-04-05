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
      icon: [{ url: '/doddapaneni-logo.png', type: 'image/png' }],
      shortcut: [{ url: '/doddapaneni-logo.png', type: 'image/png' }],
      apple: [{ url: '/doddapaneni-logo.png', type: 'image/png' }],
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
