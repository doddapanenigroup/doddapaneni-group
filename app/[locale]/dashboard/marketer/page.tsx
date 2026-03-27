import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import type { Role } from '@/lib/constants';
import { canAccessMarketerDashboard } from '@/lib/dashboard-access';
import MarketerDashboard from '@/components/dashboard/MarketerDashboard';
import { isModuleAllowedForRole } from '@/lib/module-permissions';

export default async function MarketerDashboardPage() {
  const session = await auth();
  const locale = await getLocale();

  const role = session?.user?.role;
  if (!session?.user || !canAccessMarketerDashboard(role as Role | null | undefined)) {
    redirect(`/${locale}/dashboard`);
  }

  // Overlay module permission: if both pages+blogs are denied, block the dashboard.
  const canPages = await isModuleAllowedForRole(role as any, 'pages');
  const canBlogs = await isModuleAllowedForRole(role as any, 'blogs');
  if (!canPages && !canBlogs) {
    redirect(`/${locale}/dashboard`);
  }

  return <MarketerDashboard locale={locale} viewerRole={role as Role} />;
}
