import ContentPageBoundary from '@/components/ContentPageBoundary';
import DisclaimerPageClient from './DisclaimerPageClient';
import { localeFromRouteParam } from '@/lib/locale-from-path';

type Props = { params: Promise<{ locale: string }> };

export default async function DisclaimerPage({ params }: Props) {
  const { locale: paramLocale } = await params;
  const locale = localeFromRouteParam(paramLocale);

  return (
    <ContentPageBoundary pageKey="disclaimer" locale={locale}>
      <DisclaimerPageClient />
    </ContentPageBoundary>
  );
}
