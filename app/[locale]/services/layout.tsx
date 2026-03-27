import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { getSiteOrigin } from '@/lib/site-origin';
import { publicPathWithLocale } from '@/lib/sector-landing';
import { alternateLanguagesForPathname } from '@/lib/sitemap-build';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: paramLocale } = await params;
  if (!routing.locales.includes(paramLocale as (typeof routing.locales)[number])) {
    notFound();
  }
  const locale = paramLocale;
  const t = await getTranslations({ locale, namespace: 'ServicesPage' });
  const title = `${t('title')} | Doddapaneni Group`;
  const description = t('description');
  const origin = getSiteOrigin();
  const path = publicPathWithLocale(locale, 'services');
  const canonical = `${origin}${path}`;

  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: {
      canonical,
      languages: alternateLanguagesForPathname(origin, '/services'),
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'Doddapaneni Group',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
