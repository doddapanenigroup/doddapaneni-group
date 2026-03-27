import ContentPageBoundary from '@/components/ContentPageBoundary';
import ContactPageClient from './ContactPageClient';
import { localeFromRouteParam } from '@/lib/locale-from-path';

type Props = { params: Promise<{ locale: string }> };

export default async function ContactPage({ params }: Props) {
  const { locale: paramLocale } = await params;
  const locale = localeFromRouteParam(paramLocale);

  return (
    <ContentPageBoundary pageKey="contact" locale={locale}>
      <ContactPageClient />
    </ContentPageBoundary>
  );
}
