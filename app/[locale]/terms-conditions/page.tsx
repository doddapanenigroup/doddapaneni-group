import { permanentRedirect } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { publicPathWithLocale } from '@/lib/sector-landing';

type Props = { params: Promise<{ locale: string }> };

export default async function TermsConditionsRedirect({ params }: Props) {
  const { locale: paramLocale } = await params;
  const locale = routing.locales.includes(paramLocale as (typeof routing.locales)[number])
    ? paramLocale
    : routing.defaultLocale;
  permanentRedirect(publicPathWithLocale(locale, 'terms'));
}
