import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { publicPathForLocale } from '@/lib/public-path-with-locale';
import type { Role } from '@/lib/constants';
import { canAccessAdminDashboard } from '@/lib/dashboard-access';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import { loadAdminDashboardUserRows } from '@/lib/admin-dashboard-users';

type Props = { params: Promise<{ locale: string }> };

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboardPage({ params }: Props) {
  const session = await auth();
  const { locale } = await params;

  if (!session?.user || !canAccessAdminDashboard(session.user.role as Role | null | undefined)) {
    redirect(publicPathForLocale(locale, '/dashboard'));
  }

  const users = await loadAdminDashboardUserRows();

  return (
    <AdminDashboard users={users} locale={locale} currentUserId={session.user.id} />
  );
}
