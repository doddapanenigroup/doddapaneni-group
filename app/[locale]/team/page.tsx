import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import TeamPageClient from './TeamPageClient';

type Props = { params: Promise<{ locale: string }> };

export default async function TeamPage({ params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  return <TeamPageClient />;
}
