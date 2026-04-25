import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import NewsList from '@/components/news-system/NewsList';
import {
  DODDAPANENI_NEWS_SECTORS,
  canonicalSectorSlug,
  getSectorBySlug,
} from '@/lib/doddapaneni-news';
import { localeFromRouteParam } from '@/lib/locale-from-path';
import { routing } from '@/i18n/routing';
import { getSiteOrigin } from '@/lib/site-origin';
import { absoluteUrlForLocale, alternateLanguagesForPathname } from '@/lib/sitemap-build';
import { publicPathWithLocale } from '@/lib/sector-landing';

type Props = { params: Promise<{ locale: string; sector: string }> };

export const revalidate = 300;

export function generateStaticParams() {
  const out: Array<{ locale: string; sector: string }> = [];
  for (const locale of routing.locales) {
    for (const sector of DODDAPANENI_NEWS_SECTORS) {
      out.push({ locale, sector: sector.slug });
    }
  }
  return out;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: paramLocale, sector: sectorSlug } = await params;
  const locale = localeFromRouteParam(paramLocale);
  const canonicalSector = canonicalSectorSlug(sectorSlug);
  if (!canonicalSector) return {};
  const sector = getSectorBySlug(canonicalSector);
  if (!sector) return {};

  const origin = getSiteOrigin();
  const pathname = `/doddapaneni/${canonicalSector}/news`;
  const canonical = absoluteUrlForLocale(origin, locale, pathname);

  return {
    title: `${sector.name} News | Doddapaneni Group`,
    description: `Latest updates and practical insights from the ${sector.name} sector.`,
    alternates: {
      canonical,
      languages: alternateLanguagesForPathname(origin, pathname),
    },
  };
}

export default async function SectorNewsListPage({ params }: Props) {
  const { locale: paramLocale, sector: rawSectorSlug } = await params;
  const locale = localeFromRouteParam(paramLocale);
  if (!routing.locales.includes(locale)) notFound();

  const canonicalSector = canonicalSectorSlug(rawSectorSlug);
  if (!canonicalSector) notFound();
  if (rawSectorSlug !== canonicalSector) {
    permanentRedirect(publicPathWithLocale(locale, 'doddapaneni', canonicalSector, 'news'));
  }

  const sector = getSectorBySlug(canonicalSector);
  if (!sector) notFound();

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-blue-950 px-4 py-8 text-white sm:px-6 md:py-10 lg:px-8">
        <div className="mx-auto w-full max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">Sector</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">{sector.name}</h1>
          <p className="mt-2 text-sm text-blue-100 sm:text-base">
            Browse latest news in a quick, line-wise feed.
          </p>
        </div>
      </section>
      <NewsList locale={locale} sector={sector} articles={sector.news} />
    </div>
  );
}
