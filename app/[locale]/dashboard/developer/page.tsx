import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import type { Role } from '@/lib/constants';
import { canAccessDeveloperDashboard } from '@/lib/dashboard-access';
import DeveloperDashboard from '@/components/dashboard/DeveloperDashboard';

export default async function DeveloperDashboardPage() {
  const session = await auth();
  const locale = await getLocale();

  const role = session?.user?.role;
  if (!session?.user || !canAccessDeveloperDashboard(role as Role | null | undefined)) {
    redirect(`/${locale}/dashboard`);
  }

  return <DeveloperDashboard locale={locale} viewerRole={role as Role} />;
}
