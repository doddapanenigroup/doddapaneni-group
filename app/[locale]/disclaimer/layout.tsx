import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { getSiteOrigin } from '@/lib/site-origin';
import { publicPathWithLocale } from '@/lib/sector-landing';
import { alternateLanguagesForPathname } from '@/lib/sitemap-build';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: paramLocale } = await params;
  if (!routing.locales.includes(paramLocale as (typeof routing.locales)[number])) {
    notFound();
  }
  const locale = paramLocale;
  const t = await getTranslations({ locale, namespace: 'Disclaimer' });
  const title = t('metaTitle');
  const description = t('metaDescription');
  const ogTitle = t('metaOgTitle');
  const ogDescription = t('metaOgDescription');
  const rawKeywords = t('metaKeywords');
  const keywords = rawKeywords
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);

  const origin = getSiteOrigin();
  const canonical = `${origin}${publicPathWithLocale(locale, 'disclaimer')}`;

  return {
    title,
    description,
    ...(keywords.length > 0 ? { keywords } : {}),
    alternates: {
      canonical,
      languages: alternateLanguagesForPathname(origin, '/disclaimer'),
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonical,
      siteName: 'Doddapaneni Group',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
    },
    robots: { index: true, follow: true },
  };
}

export default function DisclaimerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
