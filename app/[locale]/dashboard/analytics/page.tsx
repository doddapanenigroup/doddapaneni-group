import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import type { Role } from '@/lib/constants';
import { canAccessMarketerDashboard } from '@/lib/dashboard-access';
import AnalyticsDashboard from '@/components/dashboard/AnalyticsDashboard';

export default async function AnalyticsPage() {
  const session = await auth();
  const locale = await getLocale();

  const role = session?.user?.role;
  if (!session?.user || !canAccessMarketerDashboard(role as Role | null | undefined)) {
    redirect(`/${locale}/dashboard`);
  }

  return <AnalyticsDashboard locale={locale} viewerRole={role as Role} />;
}
