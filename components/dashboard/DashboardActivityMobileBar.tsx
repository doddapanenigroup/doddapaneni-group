'use client';

import { History, Megaphone } from 'lucide-react';
import type { Role } from '@/lib/constants';
import { hasDeveloperAccess, hasMarketerAccess, isMarketer } from '@/lib/role-utils';
import { useDashboardActivitySheetOptional } from '@/components/dashboard/DashboardActivitySheetProvider';

export default function DashboardActivityMobileBar({ role }: { role: Role }) {
  const activity = useDashboardActivitySheetOptional();
  if (!activity) return null;
  const showRecent = hasDeveloperAccess(role) || isMarketer(role);
  const showMarketing = hasMarketerAccess(role);
  if (!showRecent && !showMarketing) return null;

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-wrap gap-2 px-4 pb-3 sm:px-6 lg:px-8 xl:hidden">
      {showRecent ? (
        <button
          type="button"
          onClick={() => activity.openActivitySheet('recent')}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <History size={14} className="shrink-0 opacity-80" aria-hidden />
          Recent activity
        </button>
      ) : null}
      {showMarketing ? (
        <button
          type="button"
          onClick={() => activity.openActivitySheet('marketing')}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <Megaphone size={14} className="shrink-0 opacity-80" aria-hidden />
          Marketing & SEO
        </button>
      ) : null}
    </div>
  );
}
