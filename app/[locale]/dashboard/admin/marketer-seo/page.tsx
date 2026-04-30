import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { publicPathForLocale } from '@/lib/public-path-with-locale';
import type { Role } from '@/lib/constants';
import { canAccessAdminDashboard } from '@/lib/dashboard-access';
import AdminActivityLogsPage from '@/components/dashboard/AdminActivityLogsPage';

type Props = { params: Promise<{ locale: string }> };

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminMarketerSeoPage({ params }: Props) {
  const session = await auth();
  const { locale } = await params;

  if (!session?.user || !canAccessAdminDashboard(session.user.role as Role | null | undefined)) {
    redirect(publicPathForLocale(locale, '/dashboard'));
  }

  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-6xl px-4 py-8 text-sm text-slate-500 xl:max-w-7xl 2xl:max-w-[90rem]">
          Loading…
        </div>
      }
    >
      <AdminActivityLogsPage locale={locale} kind="marketing" />
    </Suspense>
  );
}
