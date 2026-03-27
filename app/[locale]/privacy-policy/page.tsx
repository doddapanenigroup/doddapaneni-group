import ContentPageBoundary from '@/components/ContentPageBoundary';
import PrivacyPolicyPageClient from './PrivacyPolicyPageClient';
import { localeFromRouteParam } from '@/lib/locale-from-path';

type Props = { params: Promise<{ locale: string }> };

export default async function PrivacyPolicyPage({ params }: Props) {
  const { locale: paramLocale } = await params;
  const locale = localeFromRouteParam(paramLocale);

  return (
    <ContentPageBoundary pageKey="privacy-policy" locale={locale}>
      <PrivacyPolicyPageClient />
    </ContentPageBoundary>
  );
}
