import dynamic from 'next/dynamic';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { publicPathForLocale } from '@/lib/public-path-with-locale';
import type { Role } from '@/lib/constants';
import { canAccessMarketerDashboard } from '@/lib/dashboard-access';

const AnalyticsDashboard = dynamic(() => import('@/components/dashboard/AnalyticsDashboard'), {
  loading: () => (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-600">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"
        aria-hidden
      />
      <p className="text-sm font-medium">Loading analytics…</p>
    </div>
  ),
});

type Props = { params: Promise<{ locale: string }> };

export default async function AnalyticsPage({ params }: Props) {
  const session = await auth();
  const { locale } = await params;

  const role = session?.user?.role;
  if (!session?.user || !canAccessMarketerDashboard(role as Role | null | undefined)) {
    redirect(publicPathForLocale(locale, '/dashboard'));
  }

  return <AnalyticsDashboard locale={locale} viewerRole={role as Role} />;
}
