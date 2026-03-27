import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import SectorLandingView from '@/components/sector/SectorLandingView';
import {
  resolveAppLocale,
  sectorLandingMetadata,
  toPositiveSectorPage,
} from '@/lib/sector-landing';

type Props = {
  params: Promise<{ locale: string; company: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: paramLocale, company } = await params;
  return sectorLandingMetadata(company.trim().toLowerCase(), paramLocale);
}

export default async function CompanySectorLandingPage({ params, searchParams }: Props) {
  const { locale: paramLocale, company } = await params;

  const locale = await resolveAppLocale(paramLocale);
  if (!routing.locales.includes(locale)) notFound();

  const sectorSlug = company.trim().toLowerCase();
  const page = toPositiveSectorPage((await searchParams).page);
  return <SectorLandingView locale={locale} sectorSlug={sectorSlug} page={page} />;
}
