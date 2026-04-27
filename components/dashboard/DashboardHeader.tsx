'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { KeyRound, LayoutDashboard, LogOut } from 'lucide-react';
import type { Role } from '@/lib/constants';
import { getDashboardTitle, getRoleLabel } from '@/lib/dashboard-title';
import DashboardThemeToggle from '@/components/dashboard/DashboardThemeToggle';
import DashboardNotificationBell from '@/components/dashboard/DashboardNotificationBell';
import GlobalSearchPalette from '@/components/dashboard/GlobalSearchPalette';
import { publicPathForLocale } from '@/lib/public-path-with-locale';
import { dashboardIconButtonClass, dashboardTopBarClass } from '@/lib/dashboard-ui';

export default function DashboardHeader({
  user,
  locale,
}: {
  user: { email: string; name: string | null; username?: string | null; role: Role };
  locale: string;
}) {
  return (
    <header className={dashboardTopBarClass}>
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-3.5 sm:px-6 lg:flex-row lg:items-center lg:gap-8 lg:px-8 lg:py-4 xl:px-10">
        {/* Identity */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-indigo-600/90 dark:text-indigo-400">
            Doddapaneni Group
          </p>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="truncate text-lg font-bold tracking-tight text-slate-950 dark:text-white sm:text-xl">
              {getDashboardTitle(user.role)}
            </h1>
            <span className="inline-flex shrink-0 items-center rounded-full bg-indigo-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm dark:bg-indigo-500">
              {getRoleLabel(user.role)}
            </span>
          </div>
        </div>

        {/* Search — centered / grows on large screens */}
        <div className="w-full min-w-0 lg:max-w-md lg:flex-1 xl:max-w-lg">
          <GlobalSearchPalette locale={locale} role={user.role} />
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2 lg:shrink-0">
          <span
            className="mr-1 hidden max-w-[22rem] truncate text-xs text-slate-600 dark:text-slate-400 xl:inline"
            title={[user.name, user.username ? `@${user.username}` : null, user.email].filter(Boolean).join(' · ')}
          >
            {user.name ? <span className="text-slate-800 dark:text-slate-200">{user.name}</span> : null}
            {user.name && (user.username || user.email) ? <span className="mx-1 text-slate-400">·</span> : null}
            {user.username ? (
              <span className="font-mono text-slate-700 dark:text-slate-300">@{user.username}</span>
            ) : null}
            {(user.name || user.username) && user.email ? <span className="mx-1 text-slate-400">·</span> : null}
            <span>{user.email}</span>
          </span>

          <DashboardNotificationBell />

          <DashboardThemeToggle />

          <Link
            href={publicPathForLocale(locale, '/')}
            className={dashboardIconButtonClass}
            title="Public site"
            aria-label="Public site"
          >
            <LayoutDashboard size={18} className="opacity-85" />
          </Link>
          <Link
            href={publicPathForLocale(locale, '/dashboard/security')}
            className={dashboardIconButtonClass}
            title="Change your password (current password required; no email code)"
            aria-label="Change password"
          >
            <KeyRound size={18} className="opacity-85" />
          </Link>
          <button
            type="button"
            onClick={async () => {
              try {
                await fetch('/api/session/logout', {
                  method: 'POST',
                  credentials: 'include',
                });
              } catch {
                // ignore
              }
              await signOut({ callbackUrl: publicPathForLocale(locale, '/login') });
            }}
            className={dashboardIconButtonClass}
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
