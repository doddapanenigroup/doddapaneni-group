import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import HomepageOrganizationJsonLd from '@/components/seo/HomepageOrganizationJsonLd';
import { getBusinessDivisionsForHome } from '@/lib/business-divisions-home';
import ContentPageBoundary from '@/components/ContentPageBoundary';
import HomePage from '@/components/home/HomePage';
import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import { getCachedLayoutPageSeo } from '@/lib/cached-layout-seo';
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
  const slug = locale === routing.defaultLocale ? 'home' : `${locale}/home`;
  const seo = await getCachedLayoutPageSeo(slug, locale);
  const t = await getTranslations({ locale, namespace: 'Metadata' });
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
