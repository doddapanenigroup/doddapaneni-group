import ContentPageBoundary from '@/components/ContentPageBoundary';
import FaqPageClient from './FaqPageClient';
import { localeFromRouteParam } from '@/lib/locale-from-path';

type Props = { params: Promise<{ locale: string }> };

export default async function FaqPage({ params }: Props) {
  const { locale: paramLocale } = await params;
  const locale = localeFromRouteParam(paramLocale);

  return (
    <ContentPageBoundary pageKey="faq" locale={locale}>
      <FaqPageClient />
    </ContentPageBoundary>
  );
}
