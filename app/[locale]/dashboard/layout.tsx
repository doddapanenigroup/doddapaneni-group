import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import RecordDeveloperPage from '@/components/dashboard/RecordDeveloperPage';
import RecordDashboardVisit from '@/components/dashboard/RecordDashboardVisit';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/dashboard`);
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <RecordDeveloperPage />
      <RecordDashboardVisit />
      <DashboardHeader user={session.user} locale={locale} />
      <main className="flex-1 overflow-auto w-full max-w-[1400px] mx-auto pt-4 pb-8 px-6 sm:px-8 lg:px-12 xl:px-16">
        {children}
      </main>
    </div>
  );
}
