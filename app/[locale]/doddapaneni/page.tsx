import { permanentRedirect } from 'next/navigation';
import { localeFromRouteParam } from '@/lib/locale-from-path';
import { publicPathWithLocale } from '@/lib/sector-landing';

export default async function DoddapaneniRootRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: paramLocale } = await params;
  const locale = localeFromRouteParam(paramLocale);
  permanentRedirect(publicPathWithLocale(locale, 'doddapaneni', 'news'));
}
