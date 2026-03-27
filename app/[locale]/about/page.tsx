import ContentPageBoundary from '@/components/ContentPageBoundary';
import AboutPageClient from './AboutPageClient';
import { localeFromRouteParam } from '@/lib/locale-from-path';

type Props = { params: Promise<{ locale: string }> };

export default async function AboutPage({ params }: Props) {
  const { locale: paramLocale } = await params;
  const locale = localeFromRouteParam(paramLocale);

  return (
    <ContentPageBoundary pageKey="about" locale={locale}>
      <AboutPageClient />
    </ContentPageBoundary>
  );
}
