import { createTranslator } from '@/lib/translation-format';
import { getDictionary } from '@/lib/translations';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { preload } from 'react-dom';
import HomepageOrganizationJsonLd from '@/components/seo/HomepageOrganizationJsonLd';
import { getBusinessDivisionsForHome } from '@/lib/business-divisions-home';
import ContentPageBoundary from '@/components/ContentPageBoundary';
import HomeHero from '@/components/home/HomeHero';
import type { HomeHeroCopy } from '@/components/home/HomeHero';
import HomePage from '@/components/home/HomePage';
import HomeDivisionsGrid from '@/components/home/HomeDivisionsGrid';
import { findPublishedPageContent } from '@/lib/public-page-content';
import { localeFromRouteParam } from '@/lib/locale-from-path';
import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import { getCachedLayoutPageSeo } from '@/lib/cached-layout-seo';
import { absoluteUrlForLocale, alternateLanguagesForPathname } from '@/lib/sitemap-build';
import { getSiteOrigin } from '@/lib/site-origin';

/** Sector live flags refresh via `unstable_cache` + `revalidateTag('sectors-public')` on admin toggle. */
export const revalidate = 60;
/** Avoid build-time DB fetches during static prerender on deploy workers. */
export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

async function HomePageWithDivisions({ locale }: { locale: string }) {
  const divisions = await getBusinessDivisionsForHome(locale);
  return <HomePage divisions={divisions} />;
}

/** CMS home replaces hero + below-fold, but sector cards still come from `Sector.isLive` in the DB. */
async function HomeDivisionsSection({ locale }: { locale: string }) {
  const divisions = await getBusinessDivisionsForHome(locale);
  return <HomeDivisionsGrid divisions={divisions} />;
}

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

  const cmsPromise = findPublishedPageContent('home', locale);
  preload('/image-hero-960.webp', { as: 'image', type: 'image/webp', fetchPriority: 'high' });
  const cms = await cmsPromise;

  if (cms && (cms.title || cms.body)) {
    return (
      <>
        <ContentPageBoundary pageKey="home" locale={locale} cms={cms}>
          {null}
        </ContentPageBoundary>
        <Suspense
          fallback={
            <div
              className="min-h-[48rem] border-b border-slate-100 bg-slate-50/80"
              aria-busy="true"
              aria-label="Loading"
            />
          }
        >
          <HomeDivisionsSection locale={locale} />
        </Suspense>
        <Suspense fallback={null}>
          <HomepageOrganizationJsonLd locale={locale} />
        </Suspense>
      </>
    );
  }

  const tHome = createTranslator(getDictionary(locale), 'Home');
  const heroCopy: HomeHeroCopy = {
    heroImageAlt: tHome('heroImageAlt'),
    hubHeroTitle: tHome('hubHeroTitle'),
    hubHeroSubtitle: tHome('hubHeroSubtitle'),
    hubHeroLead: tHome('hubHeroLead'),
    businessDivisions: tHome('businessDivisions'),
    learnAboutUs: tHome('learnAboutUs'),
    getInTouch: tHome('getInTouch'),
  };
  const appLocale = localeFromRouteParam(locale);

  return (
    <>
      <ContentPageBoundary pageKey="home" locale={locale} cms={cms}>
        <>
          <HomeHero locale={appLocale} copy={heroCopy} />
          <Suspense
            fallback={
              <div
                className="min-h-[28rem] bg-slate-100"
                aria-busy="true"
                aria-label="Loading"
              />
            }
          >
            <HomePageWithDivisions locale={locale} />
          </Suspense>
        </>
      </ContentPageBoundary>
      <Suspense fallback={null}>
        <HomepageOrganizationJsonLd locale={locale} />
      </Suspense>
    </>
  );
}
