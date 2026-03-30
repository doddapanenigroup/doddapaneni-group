'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

type Props = {
  icon: LucideIcon;
  title: string;
  description: ReactNode;
  actions?: ReactNode;
};

export default function DashboardPageHeader({ icon: Icon, title, description, actions }: Props) {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.05)] dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-black/25">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-slate-800 via-blue-800 to-indigo-700 dark:from-slate-600 dark:via-blue-600 dark:to-indigo-500"
        aria-hidden
      />
      <div className="flex flex-col gap-4 px-5 py-5 pl-6 sm:px-8 sm:py-6 md:flex-row md:items-start md:justify-between md:gap-8">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Workspace
          </p>
          <h1 className="mt-1.5 flex flex-wrap items-center gap-3 text-xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm ring-1 ring-slate-900/10 dark:bg-slate-100 dark:text-slate-900 dark:ring-white/10 sm:h-11 sm:w-11">
              <Icon size={22} strokeWidth={2} aria-hidden />
            </span>
            <span className="min-w-0 truncate">{title}</span>
          </h1>
          <div className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {description}
          </div>
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 pt-0.5 md:justify-end md:pt-1">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
