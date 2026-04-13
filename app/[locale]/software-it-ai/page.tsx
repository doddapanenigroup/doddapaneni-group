import { createTranslator } from '@/lib/translation-format';
import { getDictionary } from '@/lib/translations';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SoftwareItAiSectorLanding from '@/components/sector/SoftwareItAiSectorLanding';
import { routing } from '@/i18n/routing';
import { localeFromRouteParam } from '@/lib/locale-from-path';
import { sectorLandingMetadata } from '@/lib/sector-landing';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: paramLocale } = await params;
  const base = await sectorLandingMetadata('software-it-ai', paramLocale);
  const locale = localeFromRouteParam(paramLocale);
  const t = createTranslator(getDictionary(locale), 'SoftwareItAiSector');
  const title = t('metaTitle');
  const description = t('metaDescription');
  const keywordsRaw = t('metaKeywords');
  const keywords = keywordsRaw
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);

  return {
    ...base,
    title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    openGraph: {
      ...base.openGraph,
      title,
      description,
    },
    twitter: {
      ...base.twitter,
      title,
      description,
    },
  };
}

export default async function SoftwareItAiSectorPage({ params }: Props) {
  const { locale: paramLocale } = await params;
  const locale = localeFromRouteParam(paramLocale);
  if (!routing.locales.includes(locale)) notFound();

  return <SoftwareItAiSectorLanding locale={locale} />;
}

