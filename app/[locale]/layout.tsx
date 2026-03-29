import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { getCachedLayoutPageSeo } from '@/lib/cached-layout-seo';
import { alternateLanguagesForPathname, absoluteUrlForLocale } from '@/lib/sitemap-build';
import { getSiteOrigin } from '@/lib/site-origin';

/** Pre-render all locale variants for static routes that compose with child `generateStaticParams`. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? '';
  const segments = pathname.split('/').filter(Boolean);
  const maybeLocale = segments[0];
  const hasLocalePrefix =
    !!maybeLocale && routing.locales.includes(maybeLocale as (typeof routing.locales)[number]);
  const routeSegments = hasLocalePrefix ? segments.slice(1) : segments;
  const routePath = routeSegments.join('/');
  const baseSlug = routePath ? routePath : 'home';
  const slug = locale === routing.defaultLocale ? baseSlug : `${locale}/${baseSlug}`;

  const seo = await getCachedLayoutPageSeo(slug, locale);

  const title = seo?.metaTitle?.trim() || seo?.title?.trim() || t('title');
  const description = seo?.metaDescription?.trim() || t('description');

  const origin = getSiteOrigin();
  const pathnameForSeo = routePath ? `/${routePath.replace(/^\/+/, '')}` : '/';
  const computedCanonical = absoluteUrlForLocale(origin, locale, pathnameForSeo);
  const canonical = seo?.canonicalUrl?.trim() || computedCanonical;

  return {
    title,
    description,
    icons: {
      icon: [
        { url: '/favicon-dg-16.png', type: 'image/png', sizes: '16x16' },
        { url: '/favicon-dg-32.png', type: 'image/png', sizes: '32x32' },
        { url: '/favicon-dg-48.png', type: 'image/png', sizes: '48x48' },
        { url: '/favicon-dg-64.png', type: 'image/png', sizes: '64x64' },
        { url: '/favicon-dg-192.png', type: 'image/png', sizes: '192x192' },
        { url: '/favicon-dg-512.png', type: 'image/png', sizes: '512x512' },
      ],
      shortcut: [{ url: '/favicon-dg-32.png', type: 'image/png', sizes: '32x32' }],
      apple: [{ url: '/favicon-dg-180.png', type: 'image/png', sizes: '180x180' }],
    },
    openGraph: {
      title: seo?.ogTitle?.trim() || seo?.metaTitle?.trim() || title,
      description: seo?.ogDescription?.trim() || seo?.metaDescription?.trim() || description,
      images: seo?.ogImage ? [{ url: seo.ogImage }] : undefined,
    },
    alternates: {
      canonical,
      languages: alternateLanguagesForPathname(origin, pathnameForSeo),
    },
    keywords: seo?.keywords ?? undefined,
    other: { google: 'notranslate' },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: paramLocale } = await params;
  if (!routing.locales.includes(paramLocale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(paramLocale as (typeof routing.locales)[number]);

  return <>{children}</>;
}
