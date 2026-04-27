'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { dashboardHeroClass } from '@/lib/dashboard-ui';

type Props = {
  icon: LucideIcon;
  title: string;
  description: ReactNode;
  actions?: ReactNode;
};

export default function DashboardPageHeader({ icon: Icon, title, description, actions }: Props) {
  return (
    <header className={dashboardHeroClass}>
      <div className="relative z-[2] flex flex-col gap-4 px-5 py-6 sm:px-8 sm:py-7 md:flex-row md:items-start md:justify-between md:gap-8">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
            Workspace
          </p>
          <h1 className="mt-2 flex flex-wrap items-center gap-3 text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm dark:bg-indigo-500 sm:h-12 sm:w-12">
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
