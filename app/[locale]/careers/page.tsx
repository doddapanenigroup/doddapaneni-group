import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import { localeFromRouteParam } from '@/lib/locale-from-path';
import { getPublishedCareerJobsCached } from '@/lib/data/careers-public';
import CareersPageClient from './CareersPageClient';

type Props = { params: Promise<{ locale: string }> };

export default async function CareersPage({ params }: Props) {
  const { locale: paramLocale } = await params;
  if (!routing.locales.includes(paramLocale as (typeof routing.locales)[number])) {
    notFound();
  }
  const locale = localeFromRouteParam(paramLocale);
  const jobs = await getPublishedCareerJobsCached(locale);
  return <CareersPageClient jobs={jobs} locale={locale} />;
}
