import type { Metadata } from 'next';
import HomepageOrganizationJsonLd from '@/components/seo/HomepageOrganizationJsonLd';
import { getBusinessDivisionsForHome } from '@/lib/business-divisions-home';
import ContentPageBoundary from '@/components/ContentPageBoundary';
import HomePage from '@/components/home/HomePage';
import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import { absoluteUrlForLocale, alternateLanguagesForPathname } from '@/lib/sitemap-build';
import { getSiteOrigin } from '@/lib/site-origin';

export const revalidate = 120;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: paramLocale } = await params;
  const locale = routing.locales.includes(paramLocale as (typeof routing.locales)[number])
    ? paramLocale
    : routing.defaultLocale;
  const origin = getSiteOrigin();
  const canonical = absoluteUrlForLocale(origin, locale, '/');

  return {
    alternates: {
      canonical,
      languages: alternateLanguagesForPathname(origin, '/'),
    },
  };
}

export default async function Page({ params }: Props) {
  const { locale: paramLocale } = await params;
  const locale = routing.locales.includes(paramLocale as (typeof routing.locales)[number])
    ? paramLocale
    : routing.defaultLocale;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const divisions = await getBusinessDivisionsForHome();

  return (
    <>
      <HomepageOrganizationJsonLd locale={locale} />
      <ContentPageBoundary pageKey="home" locale={locale}>
        <HomePage divisions={divisions} />
      </ContentPageBoundary>
    </>
  );
}
