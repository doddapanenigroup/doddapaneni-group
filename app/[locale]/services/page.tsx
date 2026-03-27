import ContentPageBoundary from '@/components/ContentPageBoundary';
import ServicesPageClient from './ServicesPageClient';
import { localeFromRouteParam } from '@/lib/locale-from-path';

type Props = { params: Promise<{ locale: string }> };

export default async function ServicesPage({ params }: Props) {
  const { locale: paramLocale } = await params;
  const locale = localeFromRouteParam(paramLocale);

  return (
    <ContentPageBoundary pageKey="services" locale={locale}>
      <ServicesPageClient />
    </ContentPageBoundary>
  );
}
