import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { publicPathForLocale } from '@/lib/public-path-with-locale';
import type { Role } from '@/lib/constants';
import { canAccessHRCareerDashboard } from '@/lib/dashboard-access';
import HrDashboardContent from '@/components/dashboard/HrDashboardContent';

type Props = { params: Promise<{ locale: string }> };

export const dynamic = 'force-dynamic';

export default async function HrDashboardPage({ params }: Props) {
  const session = await auth();
  const { locale } = await params;
  const role = session?.user?.role as Role | undefined;

  if (!session?.user) {
    redirect(publicPathForLocale(locale, '/login'));
  }
  if (!canAccessHRCareerDashboard(role)) {
    redirect(publicPathForLocale(locale, '/dashboard'));
  }

  return <HrDashboardContent />;
}
