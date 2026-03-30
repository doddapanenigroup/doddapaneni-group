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
    <header className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06)] dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-black/30">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-800 via-blue-700 to-indigo-600 dark:from-blue-500 dark:via-violet-600 dark:to-indigo-500"
        aria-hidden
      />
      <div className="flex flex-col gap-5 px-5 py-6 pl-6 sm:px-8 sm:py-7 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            Control center
          </p>
          <h1 className="mt-2 flex items-center gap-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-[1.65rem]">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md ring-1 ring-slate-900/10 dark:bg-slate-100 dark:text-slate-900 dark:ring-white/10">
              <Icon size={22} strokeWidth={2} aria-hidden />
            </span>
            <span className="truncate">{title}</span>
          </h1>
          <div className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {description}
          </div>
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
