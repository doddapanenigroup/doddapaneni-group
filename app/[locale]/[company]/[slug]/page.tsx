import { notFound, permanentRedirect } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { resolveCompanyRouteParamToSectorSlug } from '@/lib/company-divisions';
import { fetchPublishedSectorBlogPost } from '@/lib/sector-blog-post';
import { localeFromRouteParam } from '@/lib/locale-from-path';
import { publicPathWithLocale } from '@/lib/sector-landing';

/**
 * Legacy URL `/{division}/{article}` → canonical `/news/{division}/{article}`.
 */
export const revalidate = 120;

type Props = { params: Promise<{ locale: string; company: string; slug: string }> };

export default async function LegacySectorBlogRedirect({ params }: Props) {
  const { locale: paramLocale, company, slug } = await params;
  const locale = localeFromRouteParam(paramLocale);
  const sectorSlug = resolveCompanyRouteParamToSectorSlug(company);

  if (!routing.locales.includes(locale)) {
    notFound();
  }

  const row = await fetchPublishedSectorBlogPost(sectorSlug, slug, locale);
  if (!row) notFound();

  permanentRedirect(publicPathWithLocale(locale, 'news', sectorSlug, row.slug));
}
