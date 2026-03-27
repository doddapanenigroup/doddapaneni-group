'use client';

import dynamic from 'next/dynamic';
import { BarChart3 } from 'lucide-react';

function VisitStatsLoading() {
  return (
    <div
      className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900/90"
      role="status"
      aria-busy="true"
      aria-label="Loading visit statistics"
    >
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-violet-600 border-t-transparent dark:border-violet-400"
        aria-hidden
      />
      <p className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
        <BarChart3 className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
        Loading charts…
      </p>
    </div>
  );
}

const VisitStats = dynamic(() => import('@/components/dashboard/VisitStats'), {
  loading: () => <VisitStatsLoading />,
});

export default function VisitStatsLazy() {
  return <VisitStats />;
}
