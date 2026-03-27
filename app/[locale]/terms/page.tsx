import ContentPageBoundary from '@/components/ContentPageBoundary';
import TermsPageClient from './TermsPageClient';
import { localeFromRouteParam } from '@/lib/locale-from-path';

type Props = { params: Promise<{ locale: string }> };

export default async function TermsPage({ params }: Props) {
  const { locale: paramLocale } = await params;
  const locale = localeFromRouteParam(paramLocale);

  return (
    <ContentPageBoundary pageKey="terms" locale={locale}>
      <TermsPageClient />
    </ContentPageBoundary>
  );
}
