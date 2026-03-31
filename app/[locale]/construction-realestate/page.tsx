import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SectorCompaniesOnlyView from '@/components/sector/SectorCompaniesOnlyView';
import { routing } from '@/i18n/routing';
import { localeFromRouteParam } from '@/lib/locale-from-path';
import { sectorLandingMetadata } from '@/lib/sector-landing';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return sectorLandingMetadata('construction-realestate', locale);
}

export default async function ConstructionRealestateSectorPage({ params }: Props) {
  const { locale: paramLocale } = await params;
  const locale = localeFromRouteParam(paramLocale);
  if (!routing.locales.includes(locale)) notFound();

  return <SectorCompaniesOnlyView locale={locale} sectorSlug="construction-realestate" />;
}

