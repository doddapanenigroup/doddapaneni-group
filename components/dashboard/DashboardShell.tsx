'use client';

import type { Role } from '@/lib/constants';
import { DashboardThemeProvider } from '@/components/dashboard/DashboardThemeProvider';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import AutoLogoutOnUnauthenticated from '@/components/dashboard/AutoLogoutOnUnauthenticated';
import { DashboardShortcutsProvider } from '@/components/dashboard/DashboardShortcutsProvider';

export default function DashboardShell({
  user,
  locale,
  children,
}: {
  user: { email: string; name: string | null; username?: string | null; role: Role };
  locale: string;
  children: React.ReactNode;
}) {
  return (
    <DashboardThemeProvider>
      <DashboardShortcutsProvider>
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
          <AutoLogoutOnUnauthenticated locale={locale} />
          <DashboardHeader user={user} locale={locale} />
          <div className="mx-auto flex w-full max-w-[1600px] items-start gap-6 px-4 pt-6 sm:px-6 sm:pt-8 lg:gap-8 lg:px-8 xl:px-12">
            <DashboardSidebar locale={locale} role={user.role} />
            <main className="min-w-0 flex-1 pb-12 sm:pb-14 md:pb-16">{children}</main>
          </div>
        </div>
      </DashboardShortcutsProvider>
    </DashboardThemeProvider>
  );
}
