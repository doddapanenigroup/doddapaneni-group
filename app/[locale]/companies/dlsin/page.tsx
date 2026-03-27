import ContentPageBoundary from '@/components/ContentPageBoundary';
import DlsinPageClient from './DlsinPageClient';
import { localeFromRouteParam } from '@/lib/locale-from-path';

type Props = { params: Promise<{ locale: string }> };

export default async function DlsinPage({ params }: Props) {
  const { locale: paramLocale } = await params;
  const locale = localeFromRouteParam(paramLocale);

  return (
    <ContentPageBoundary pageKey="companies-dlsin" locale={locale}>
      <DlsinPageClient />
    </ContentPageBoundary>
  );
}
