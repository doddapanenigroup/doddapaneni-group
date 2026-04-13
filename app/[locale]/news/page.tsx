import { createTranslator } from '@/lib/translation-format';
import { getDictionary } from '@/lib/translations';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
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
import { getSectorLiveMapFromDb } from '@/lib/data/sector-repository';
import NewsSectorsHub from '@/components/news/NewsSectorsHub';

export const revalidate = 120;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: paramLocale } = await params;
  const locale = routing.locales.includes(paramLocale as (typeof routing.locales)[number])
    ? paramLocale
    : routing.defaultLocale;
  const t = createTranslator(getDictionary(locale), 'Blog');
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

  const t = createTranslator(getDictionary(locale), 'Blog');
  const sectorLiveMap = await getSectorLiveMapFromDb();

  const sectors = COMPANY_DIVISION_SLUGS.map((slug) => ({
    slug,
    label: COMPANY_DIVISION_NAV_LABELS[slug as CompanyDivisionSlug],
    isLive: sectorLiveMap[slug] ?? false,
  }));

  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-blue-900 px-4 py-14 sm:px-6 md:py-20 lg:px-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-[2.75rem] lg:leading-tight">
            {t('title')}
          </h1>
          <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-white/90" aria-hidden />
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-white/95 md:text-xl">{t('subtitle')}</p>
          {t('intro') ? (
            <p className="mx-auto mt-8 max-w-3xl text-left text-sm leading-relaxed text-white/90 sm:text-base md:text-center">
              {t('intro')}
            </p>
          ) : null}
        </div>
      </section>
      <NewsSectorsHub locale={locale} sectors={sectors} />
    </div>
  );
}
