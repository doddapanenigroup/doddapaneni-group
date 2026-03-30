'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { LayoutDashboard, LogOut, Shield } from 'lucide-react';
import type { Role } from '@/lib/constants';
import { getDashboardTitle, getRoleLabel } from '@/lib/dashboard-title';
import DashboardNotificationsMenu from '@/components/dashboard/DashboardNotificationsMenu';
import DashboardThemeToggle from '@/components/dashboard/DashboardThemeToggle';
import GlobalSearchPalette from '@/components/dashboard/GlobalSearchPalette';

const headerLinkClass =
  'inline-flex h-10 items-center gap-2 rounded-xl border border-transparent px-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-200/80 hover:bg-slate-100 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800/80';

export default function DashboardHeader({
  user,
  locale,
}: {
  user: { email: string; name: string | null; role: Role };
  locale: string;
}) {
  return (
    <header className="sticky top-0 z-20 w-full border-b border-slate-200/90 bg-white/95 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur-md dark:border-slate-800/90 dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-4 lg:px-10 xl:px-14">
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
          <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">
            {getDashboardTitle(user.role)}
          </h1>
          <span className="inline-flex shrink-0 items-center rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
            {getRoleLabel(user.role)}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-1.5">
          <span
            className="mr-1 hidden max-w-[200px] truncate text-sm text-slate-600 dark:text-slate-400 md:inline lg:max-w-[240px]"
            title={user.email}
          >
            {user.email}
          </span>

          <GlobalSearchPalette locale={locale} />

          <DashboardThemeToggle />
          <DashboardNotificationsMenu locale={locale} role={user.role} />

          <Link
            href={`/${locale}/dashboard/security`}
            className={headerLinkClass}
            title="Password & security"
          >
            <Shield size={18} className="shrink-0 opacity-80" />
            <span className="hidden sm:inline">Security</span>
          </Link>
          <Link href={`/${locale}`} className={headerLinkClass}>
            <LayoutDashboard size={18} className="shrink-0 opacity-80" />
            <span className="hidden sm:inline">Site</span>
          </Link>
          <button
            type="button"
            onClick={async () => {
              try {
                await fetch('/api/session/logout', { method: 'POST' });
              } catch {
                // ignore
              }
              signOut({ callbackUrl: `/${locale}/login` });
            }}
            className={headerLinkClass}
          >
            <LogOut size={18} className="shrink-0 opacity-80" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
