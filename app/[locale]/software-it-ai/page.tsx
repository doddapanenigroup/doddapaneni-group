import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SectorCompaniesOnlyView from '@/components/sector/SectorCompaniesOnlyView';
import { routing } from '@/i18n/routing';
import { localeFromRouteParam } from '@/lib/locale-from-path';
import { sectorLandingMetadata } from '@/lib/sector-landing';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return sectorLandingMetadata('software-it-ai', locale);
}

export default async function SoftwareItAiSectorPage({ params }: Props) {
  const { locale: paramLocale } = await params;
  const locale = localeFromRouteParam(paramLocale);
  if (!routing.locales.includes(locale)) notFound();

  return <SectorCompaniesOnlyView locale={locale} sectorSlug="software-it-ai" />;
}

