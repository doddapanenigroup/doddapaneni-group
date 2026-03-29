import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SectorGrid from '@/components/news-system/SectorGrid';
import { DODDAPANENI_NEWS_SECTORS } from '@/lib/doddapaneni-news';
import { localeFromRouteParam } from '@/lib/locale-from-path';
import { routing } from '@/i18n/routing';
import { getSiteOrigin } from '@/lib/site-origin';
import { absoluteUrlForLocale, alternateLanguagesForPathname } from '@/lib/sitemap-build';

type Props = { params: Promise<{ locale: string }> };

export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: paramLocale } = await params;
  const locale = localeFromRouteParam(paramLocale);
  const origin = getSiteOrigin();
  const pathname = '/doddapaneni/news';
  const canonical = absoluteUrlForLocale(origin, locale, pathname);

  return {
    title: 'Doddapaneni News Hub | Doddapaneni Group',
    description: 'Explore news and insights across all 12 Doddapaneni sectors.',
    alternates: {
      canonical,
      languages: alternateLanguagesForPathname(origin, pathname),
    },
  };
}

export default async function DoddapaneniNewsHubPage({ params }: Props) {
  const { locale: paramLocale } = await params;
  const locale = localeFromRouteParam(paramLocale);
  if (!routing.locales.includes(locale)) notFound();

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-blue-950 px-4 py-12 text-white sm:px-6 md:py-14 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">Doddapaneni</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">News by Sector</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-blue-100 sm:text-base">
            Choose a sector to read focused updates, operational insights, and practical guidance.
          </p>
        </div>
      </section>

      <SectorGrid locale={locale} sectors={DODDAPANENI_NEWS_SECTORS} />
    </div>
  );
}
