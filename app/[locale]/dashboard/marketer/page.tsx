import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { publicPathForLocale } from '@/lib/public-path-with-locale';
import type { Role } from '@/lib/constants';
import { canAccessMarketerDashboard } from '@/lib/dashboard-access';
import MarketerDashboard from '@/components/dashboard/MarketerDashboard';
import { isModuleAllowedForRole } from '@/lib/module-permissions';

type Props = { params: Promise<{ locale: string }> };

export default async function MarketerDashboardPage({ params }: Props) {
  const session = await auth();
  const { locale } = await params;

  const role = session?.user?.role;
  if (!session?.user || !canAccessMarketerDashboard(role as Role | null | undefined)) {
    redirect(publicPathForLocale(locale, '/dashboard'));
  }

  // Overlay module permission: if both pages+blogs are denied, block the dashboard.
  const modulePagesAllowed = await isModuleAllowedForRole(role as any, 'pages');
  const moduleBlogsAllowed = await isModuleAllowedForRole(role as any, 'blogs');
  /** Digital marketers use blogs + media only; pages stay on admin/developer. */
  const canPages = role === 'DIGITAL_MARKETER' ? false : modulePagesAllowed;
  const canBlogs = moduleBlogsAllowed;
  if (!canPages && !canBlogs) {
    redirect(publicPathForLocale(locale, '/dashboard'));
  }

  return (
    <MarketerDashboard locale={locale} viewerRole={role as Role} canPages={canPages} canBlogs={canBlogs} />
  );
}
