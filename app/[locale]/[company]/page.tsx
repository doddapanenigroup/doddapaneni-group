import type { ComponentType } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import DigitalMarketingSectorLanding from '@/components/sector/DigitalMarketingSectorLanding';
import HealthcareMedicalSectorLanding from '@/components/sector/HealthcareMedicalSectorLanding';
import SoftwareItAiSectorLanding from '@/components/sector/SoftwareItAiSectorLanding';
import SectorLandingView from '@/components/sector/SectorLandingView';
import { resolveCompanyRouteParamToSectorSlug } from '@/lib/company-divisions';
import { localeFromRouteParam } from '@/lib/locale-from-path';
import { sectorLandingMetadata, toPositiveSectorPage } from '@/lib/sector-landing';

/** Sectors with dedicated marketing landings (same UI for `/slug` and keyword `/slug-services` URLs). */
const CUSTOM_SECTOR_LANDING: Record<string, ComponentType<{ locale: string }>> = {
  'digital-marketing': DigitalMarketingSectorLanding,
  'software-it-ai': SoftwareItAiSectorLanding,
  'healthcare-medical': HealthcareMedicalSectorLanding,
};

type Props = {
  params: Promise<{ locale: string; company: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: paramLocale, company } = await params;
  return sectorLandingMetadata(resolveCompanyRouteParamToSectorSlug(company), paramLocale);
}

export default async function CompanySectorLandingPage({ params, searchParams }: Props) {
  const { locale: paramLocale, company } = await params;

  const locale = localeFromRouteParam(paramLocale);
  if (!routing.locales.includes(locale)) notFound();

  const sectorSlug = resolveCompanyRouteParamToSectorSlug(company);
  const CustomLanding = CUSTOM_SECTOR_LANDING[sectorSlug];
  if (CustomLanding) {
    return <CustomLanding locale={locale} />;
  }
  const page = toPositiveSectorPage((await searchParams).page);
  return <SectorLandingView locale={locale} sectorSlug={sectorSlug} page={page} />;
}
