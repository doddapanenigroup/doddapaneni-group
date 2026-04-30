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

  const moduleBlogsAllowed = await isModuleAllowedForRole(role as Role, 'blogs');
  if (!moduleBlogsAllowed) {
    redirect(publicPathForLocale(locale, '/dashboard'));
  }

  return <MarketerDashboard locale={locale} canBlogs />;
}
