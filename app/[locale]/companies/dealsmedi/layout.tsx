import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { getSiteOrigin } from '@/lib/site-origin';
import { publicPathWithLocale } from '@/lib/sector-landing';
import { alternateLanguagesForPathname } from '@/lib/sitemap-build';

const SITE_NAME = 'Doddapaneni Group';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: paramLocale } = await params;
  if (!routing.locales.includes(paramLocale as (typeof routing.locales)[number])) {
    notFound();
  }
  const t = await getTranslations({ locale: paramLocale, namespace: 'DealsMedi' });
  const title = `DealsMedi | ${SITE_NAME}`;
  const description = t('subtitle');
  const origin = getSiteOrigin();
  const path = publicPathWithLocale(paramLocale, 'companies', 'dealsmedi');
  const canonical = `${origin}${path}`;

  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: {
      canonical,
      languages: alternateLanguagesForPathname(origin, '/companies/dealsmedi'),
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default function DealsMediLayout({ children }: { children: React.ReactNode }) {
  return children;
}
