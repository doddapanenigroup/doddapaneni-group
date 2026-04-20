'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { LayoutDashboard, LogOut } from 'lucide-react';
import type { Role } from '@/lib/constants';
import { getDashboardTitle, getRoleLabel } from '@/lib/dashboard-title';
import DashboardThemeToggle from '@/components/dashboard/DashboardThemeToggle';
import GlobalSearchPalette from '@/components/dashboard/GlobalSearchPalette';
import { publicPathForLocale } from '@/lib/public-path-with-locale';

const iconActionClass =
  'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-800';

export default function DashboardHeader({
  user,
  locale,
}: {
  user: { email: string; name: string | null; role: Role };
  locale: string;
}) {
  return (
    <header className="sticky top-0 z-20 w-full border-b border-slate-200/90 bg-white/95 shadow-[0_1px_0_rgba(15,23,42,0.06)] backdrop-blur-md dark:border-slate-800/90 dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-3.5 sm:px-6 lg:flex-row lg:items-center lg:gap-6 lg:px-8 lg:py-3.5 xl:px-10">
        {/* Identity */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Doddapaneni Group
          </p>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">
              {getDashboardTitle(user.role)}
            </h1>
            <span className="inline-flex shrink-0 items-center rounded-full border border-slate-200/90 bg-slate-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-200">
              {getRoleLabel(user.role)}
            </span>
          </div>
        </div>

        {/* Search — centered / grows on large screens */}
        <div className="w-full min-w-0 lg:max-w-md lg:flex-1 xl:max-w-lg">
          <GlobalSearchPalette locale={locale} role={user.role} />
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-2.5 lg:shrink-0">
          <span
            className="mr-1 hidden max-w-[14rem] truncate text-xs text-slate-600 dark:text-slate-400 xl:inline"
            title={user.email}
          >
            {user.email}
          </span>

          <DashboardThemeToggle />

          <Link
            href={publicPathForLocale(locale, '/')}
            className={iconActionClass}
            title="Public site"
            aria-label="Public site"
          >
            <LayoutDashboard size={18} className="opacity-85" />
          </Link>
          <button
            type="button"
            onClick={async () => {
              try {
                await fetch('/api/session/logout', { method: 'POST' });
              } catch {
                // ignore
              }
              signOut({ callbackUrl: publicPathForLocale(locale, '/login') });
            }}
            className={iconActionClass}
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={18} className="opacity-85" />
          </button>
        </div>
      </div>
    </header>
  );
}
