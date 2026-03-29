import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { localeFromRouteParam } from '@/lib/locale-from-path';
import { getSiteOrigin } from '@/lib/site-origin';
import { publicPathWithLocale } from '@/lib/sector-landing';
import { alternateLanguagesForPathname } from '@/lib/sitemap-build';
import {
  COMPANY_DIVISION_NAV_LABELS,
  COMPANY_DIVISION_SLUGS,
  type CompanyDivisionSlug,
} from '@/lib/company-divisions';
import NewsSectorsHub from '@/components/news/NewsSectorsHub';

export const revalidate = 120;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: paramLocale } = await params;
  const locale = routing.locales.includes(paramLocale as (typeof routing.locales)[number])
    ? paramLocale
    : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: 'Blog' });
  const title = `${t('title')} | Doddapaneni Group`;
  const description = t('subtitle');
  const origin = getSiteOrigin();
  const path = publicPathWithLocale(locale, 'news');
  const canonical = `${origin}${path}`;

  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: {
      canonical,
      languages: alternateLanguagesForPathname(origin, '/news'),
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

export default async function NewsHubPage({ params }: Props) {
  const { locale: paramLocale } = await params;
  const locale = localeFromRouteParam(paramLocale);

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'Blog' });

  const sectors = COMPANY_DIVISION_SLUGS.map((slug) => ({
    slug,
    label: COMPANY_DIVISION_NAV_LABELS[slug as CompanyDivisionSlug],
  }));

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-blue-900 px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl">{t('title')}</h1>
          <p className="mx-auto max-w-3xl text-lg text-blue-200 md:text-xl">{t('subtitle')}</p>
          {t('intro') ? (
            <p className="mx-auto mt-6 max-w-3xl text-left text-sm leading-relaxed text-blue-100/95 sm:text-base md:text-center">
              {t('intro')}
            </p>
          ) : null}
        </div>
      </section>
      <NewsSectorsHub locale={locale} sectors={sectors} />
    </div>
  );
}
