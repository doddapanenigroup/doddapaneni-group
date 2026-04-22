import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import TeamPageClient from './TeamPageClient';
import { connectDb } from '@/lib/db';
import { getTeamMembersGrouped } from '@/lib/team-members';

type Props = { params: Promise<{ locale: string }> };

export default async function TeamPage({ params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  await connectDb();
  const team = await getTeamMembersGrouped();

  return <TeamPageClient team={team} />;
}
