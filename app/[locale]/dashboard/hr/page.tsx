import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { publicPathForLocale } from '@/lib/public-path-with-locale';
import type { Role } from '@/lib/constants';
import { canAccessHRCareerDashboard } from '@/lib/dashboard-access';
import { getDashboardTitle } from '@/lib/dashboard-title';
import HrCareerApplicationsClient from '@/components/dashboard/HrCareerApplicationsClient';

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
          {getDashboardTitle('HR')}
        </h1>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Review applications from the public careers form and download stored resumes. Admins and HR see the same
          data.
        </p>
      </div>
      <HrCareerApplicationsClient />
    </div>
  );
}
