import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { publicPathForLocale } from '@/lib/public-path-with-locale';
import type { Role } from '@/lib/constants';
import { canAccessDeveloperDashboard } from '@/lib/dashboard-access';
import DeveloperDashboard from '@/components/dashboard/DeveloperDashboard';

type Props = { params: Promise<{ locale: string }> };

export default async function DeveloperDashboardPage({ params }: Props) {
  const session = await auth();
  const { locale } = await params;

  const role = session?.user?.role;
  if (!session?.user || !canAccessDeveloperDashboard(role as Role | null | undefined)) {
    redirect(publicPathForLocale(locale, '/dashboard'));
  }

  return <DeveloperDashboard locale={locale} viewerRole={role as Role} />;
}
