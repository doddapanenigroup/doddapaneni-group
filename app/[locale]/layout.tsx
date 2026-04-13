import { createTranslator } from '@/lib/translation-format';
import { getDictionary } from '@/lib/translations';
import type { Metadata } from 'next';
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
  const t = createTranslator(getDictionary(locale), 'Metadata');
  const title = t('title');
  const description = t('description');

  return {
    title,
    description,
    icons: {
      /** Same asset; `sizes` hints help browsers pick a crisp icon (tabs are still ~16–32px OS-controlled). */
      icon: [
        { url: '/logo.webp', type: 'image/webp', sizes: '48x48' },
        { url: '/logo.webp', type: 'image/webp', sizes: '96x96' },
        { url: '/logo.webp', type: 'image/webp', sizes: '192x192' },
      ],
      shortcut: [{ url: '/logo.webp', type: 'image/webp' }],
      apple: [{ url: '/logo.webp', type: 'image/webp', sizes: '180x180' }],
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

  const initialMessages = getMessagesForLocale(locale) as Record<string, unknown>;

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
