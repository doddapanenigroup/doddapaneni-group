import ContentPageBoundary from '@/components/ContentPageBoundary';
import JanathaMirrorPageClient from './JanathaMirrorPageClient';
import { localeFromRouteParam } from '@/lib/locale-from-path';

type Props = { params: Promise<{ locale: string }> };

export default async function JanathaMirrorPage({ params }: Props) {
  const { locale: paramLocale } = await params;
  const locale = localeFromRouteParam(paramLocale);

  return (
    <ContentPageBoundary pageKey="companies-janatha-mirror" locale={locale}>
      <JanathaMirrorPageClient />
    </ContentPageBoundary>
  );
}
