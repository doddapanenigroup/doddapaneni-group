import ContentPageBoundary from '@/components/ContentPageBoundary';
import DealsmediPageClient from './DealsmediPageClient';
import { localeFromRouteParam } from '@/lib/locale-from-path';

type Props = { params: Promise<{ locale: string }> };

export default async function DealsmediPage({ params }: Props) {
  const { locale: paramLocale } = await params;
  const locale = localeFromRouteParam(paramLocale);

  return (
    <ContentPageBoundary pageKey="companies-dealsmedi" locale={locale}>
      <DealsmediPageClient />
    </ContentPageBoundary>
  );
}
