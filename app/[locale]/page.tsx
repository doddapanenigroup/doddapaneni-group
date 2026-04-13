import { createTranslator } from '@/lib/translation-format';
import { getDictionary } from '@/lib/translations';
import type { Metadata } from 'next';
import HomepageOrganizationJsonLd from '@/components/seo/HomepageOrganizationJsonLd';
import { getBusinessDivisionsForHome } from '@/lib/business-divisions-home';
import ContentPageBoundary from '@/components/ContentPageBoundary';
import HomePage from '@/components/home/HomePage';
import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import { getCachedLayoutPageSeo } from '@/lib/cached-layout-seo';
import { absoluteUrlForLocale, alternateLanguagesForPathname } from '@/lib/sitemap-build';
import { getSiteOrigin } from '@/lib/site-origin';

/** Divisions depend on admin `Sector.is_live` toggles — avoid stale “Launching soon” vs nav mismatch. */
export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: paramLocale } = await params;
  const locale = routing.locales.includes(paramLocale as (typeof routing.locales)[number])
    ? paramLocale
    : routing.defaultLocale;
  const origin = getSiteOrigin();
  const canonical = absoluteUrlForLocale(origin, locale, '/');
  const seo = await getCachedLayoutPageSeo('home', locale);
  const t = createTranslator(getDictionary(locale), 'Metadata');
  const title = seo?.metaTitle?.trim() || seo?.title?.trim() || t('title');
  const description = seo?.metaDescription?.trim() || t('description');

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: alternateLanguagesForPathname(origin, '/'),
    },
    openGraph: {
      title: seo?.ogTitle?.trim() || seo?.metaTitle?.trim() || title,
      description: seo?.ogDescription?.trim() || seo?.metaDescription?.trim() || description,
      images: seo?.ogImage ? [{ url: seo.ogImage }] : undefined,
    },
    keywords: seo?.keywords ?? undefined,
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

  const divisions = await getBusinessDivisionsForHome(locale);

  return (
    <>
      <HomepageOrganizationJsonLd locale={locale} />
      <ContentPageBoundary pageKey="home" locale={locale}>
        <HomePage divisions={divisions} />
      </ContentPageBoundary>
    </>
  );
}
