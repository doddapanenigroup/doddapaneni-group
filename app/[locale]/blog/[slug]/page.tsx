import { permanentRedirect } from 'next/navigation';
import { localeFromRouteParam } from '@/lib/locale-from-path';
import { publicPathWithLocale } from '@/lib/sector-landing';

/** Old `/blog/:slug` → canonical `/news/:slug` (hub posts without sector). */
export default async function LegacyBlogSlugRedirect({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: paramLocale, slug } = await params;
  const locale = localeFromRouteParam(paramLocale);
  permanentRedirect(publicPathWithLocale(locale, 'news', slug.trim()));
}
