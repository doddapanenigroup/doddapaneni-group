'use client';

import type { Role } from '@/lib/constants';
import { DashboardThemeProvider } from '@/components/dashboard/DashboardThemeProvider';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import RecordDeveloperPage from '@/components/dashboard/RecordDeveloperPage';
import RecordDashboardVisit from '@/components/dashboard/RecordDashboardVisit';
import AutoLogoutOnUnauthenticated from '@/components/dashboard/AutoLogoutOnUnauthenticated';
import { DashboardShortcutsProvider } from '@/components/dashboard/DashboardShortcutsProvider';

export default function DashboardShell({
  user,
  locale,
  children,
}: {
  user: { email: string; name: string | null; role: Role };
  locale: string;
  children: React.ReactNode;
}) {
  return (
    <DashboardThemeProvider>
      <DashboardShortcutsProvider>
        <RecordDeveloperPage />
        <RecordDashboardVisit />
        <AutoLogoutOnUnauthenticated />
        <DashboardHeader user={user} locale={locale} />
        <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 pt-6 sm:pt-8 pb-10 sm:pb-12 md:pb-14 min-w-0">
          {children}
        </main>
      </DashboardShortcutsProvider>
    </DashboardThemeProvider>
  );
}
