'use client';

import { useEffect, useState } from 'react';
import { History, Loader2, X } from 'lucide-react';
import { useDashboardActivitySheetOptional } from '@/components/dashboard/DashboardActivitySheetProvider';
import {
  EditsBlock,
  MarketingBlock,
  type ActivityPayload,
} from '@/components/dashboard/my-activity-blocks';
import { dashboardIconButtonClass, dashboardPanelClass } from '@/lib/dashboard-ui';

export default function DashboardActivityModal() {
  const ctx = useDashboardActivitySheetOptional();
  const sheet = ctx?.activitySheet ?? null;
  const close = ctx?.closeActivitySheet;

  const [data, setData] = useState<ActivityPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sheet) {
      setData(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch('/api/dashboard/my-activity')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load'))))
      .then((json: ActivityPayload) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) {
          setData(null);
          setError('Could not load activity.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sheet]);

  if (!ctx || !sheet) return null;

  const title =
    sheet === 'recent' ? 'Your recent activity' : 'Your marketing & SEO activity';

  return (
    <div
      className="fixed inset-0 z-[10050] flex flex-col items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dashboard-activity-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={() => close?.()}
      />
      <div
        className={`relative flex max-h-[min(92dvh,880px)] w-full max-w-lg flex-col overflow-hidden shadow-2xl ${dashboardPanelClass}`}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700 sm:px-5">
          <h2
            id="dashboard-activity-title"
            className="flex min-w-0 items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100"
          >
            <History size={20} className="shrink-0 text-indigo-600 dark:text-indigo-400" aria-hidden />
            <span className="truncate">{title}</span>
          </h2>
          <button
            type="button"
            onClick={() => close?.()}
            className={dashboardIconButtonClass}
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={2.25} aria-hidden />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-4 sm:p-5">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-slate-600 dark:text-slate-400">
              <Loader2 className="h-6 w-6 shrink-0 animate-spin" aria-hidden />
              <span>Loading…</span>
            </div>
          ) : error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : data ? (
            sheet === 'recent' ? (
              <EditsBlock data={data} />
            ) : (
              <MarketingBlock data={data} showTitle={false} />
            )
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">No data.</p>
          )}
        </div>
      </div>
    </div>
  );
}
