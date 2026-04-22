import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { publicPathForLocale } from '@/lib/public-path-with-locale';
import type { Role } from '@/lib/constants';
import { canAccessAdminDashboard } from '@/lib/dashboard-access';
import TeamAdminClient from '@/components/dashboard/TeamAdminClient';

type Props = { params: Promise<{ locale: string }> };

export default async function AdminTeamPage({ params }: Props) {
  const session = await auth();
  const { locale } = await params;

  if (!session?.user || !canAccessAdminDashboard(session.user.role as Role | null | undefined)) {
    redirect(publicPathForLocale(locale, '/dashboard'));
  }

  return (
    <TeamAdminClient locale={locale} dashboardHref={publicPathForLocale(locale, '/dashboard/admin')} />
  );
}
