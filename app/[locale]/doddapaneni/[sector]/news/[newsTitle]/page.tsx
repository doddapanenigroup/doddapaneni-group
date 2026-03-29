import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import NewsDetail from '@/components/news-system/NewsDetail';
import {
  DODDAPANENI_NEWS_SECTORS,
  canonicalSectorSlug,
  getNewsArticle,
  getSectorBySlug,
} from '@/lib/doddapaneni-news';
import { localeFromRouteParam } from '@/lib/locale-from-path';
import { routing } from '@/i18n/routing';
import { getSiteOrigin } from '@/lib/site-origin';
import { absoluteUrlForLocale, alternateLanguagesForPathname } from '@/lib/sitemap-build';
import { publicPathWithLocale } from '@/lib/sector-landing';

type Props = { params: Promise<{ locale: string; sector: string; newsTitle: string }> };

export const revalidate = 300;

export function generateStaticParams() {
  const out: Array<{ locale: string; sector: string; newsTitle: string }> = [];
  for (const locale of routing.locales) {
    for (const sector of DODDAPANENI_NEWS_SECTORS) {
      for (const article of sector.news) {
        out.push({ locale, sector: sector.slug, newsTitle: article.slug });
      }
    }
  }
  return out;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: paramLocale, sector: rawSector, newsTitle: rawNewsTitle } = await params;
  const locale = localeFromRouteParam(paramLocale);
  const canonicalSector = canonicalSectorSlug(rawSector);
  if (!canonicalSector) return {};
  const sector = getSectorBySlug(canonicalSector);
  if (!sector) return {};
  const article = getNewsArticle(sector, rawNewsTitle);
  if (!article) return {};

  const origin = getSiteOrigin();
  const pathname = `/doddapaneni/${canonicalSector}/news/${article.slug}`;
  const canonical = absoluteUrlForLocale(origin, locale, pathname);

  return {
    title: `${article.title} | ${sector.name} | Doddapaneni Group`,
    description: article.excerpt,
    alternates: {
      canonical,
      languages: alternateLanguagesForPathname(origin, pathname),
    },
  };
}

export default async function SectorNewsDetailPage({ params }: Props) {
  const { locale: paramLocale, sector: rawSectorSlug, newsTitle: rawNewsTitle } = await params;
  const locale = localeFromRouteParam(paramLocale);
  if (!routing.locales.includes(locale)) notFound();

  const canonicalSector = canonicalSectorSlug(rawSectorSlug);
  if (!canonicalSector) notFound();
  const sector = getSectorBySlug(canonicalSector);
  if (!sector) notFound();

  const article = getNewsArticle(sector, rawNewsTitle);
  if (!article) notFound();

  const canonicalPath = publicPathWithLocale(
    locale,
    'doddapaneni',
    canonicalSector,
    'news',
    article.slug,
  );
  if (rawSectorSlug !== canonicalSector || rawNewsTitle !== article.slug) {
    permanentRedirect(canonicalPath);
  }

  return <NewsDetail sector={sector} article={article} articlePath={canonicalPath} />;
}
