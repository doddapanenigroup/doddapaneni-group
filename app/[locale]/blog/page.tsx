import { permanentRedirect } from 'next/navigation';
import { localeFromRouteParam } from '@/lib/locale-from-path';
import { publicPathWithLocale } from '@/lib/sector-landing';

/** Old `/blog` listing → canonical `/news`. */
export default async function LegacyBlogIndexRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: paramLocale } = await params;
  const locale = localeFromRouteParam(paramLocale);
  permanentRedirect(publicPathWithLocale(locale, 'news'));
}
