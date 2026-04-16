'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Globe,
  Activity,
  Loader2,
} from 'lucide-react';
import { DASHBOARD_CHART_HEIGHT } from '@/components/dashboard/SafeResponsiveChart';
import type { Role } from '@/lib/constants';
import { getDashboardTitle } from '@/lib/dashboard-title';
import { publicPathForLocale } from '@/lib/public-path-with-locale';

export type AnalyticsPayload = {
  rangeDays: number;
  since: string;
  until: string;
  productionTrafficOnly: boolean;
  totals: { pageViews: number; newsViews: number };
  series: { date: string; views: number }[];
  topPages: { path: string; views: number }[];
  news: {
    totalViews: number;
    topPosts: { path: string; views: number }[];
    lcpAvgMs: number | null;
    lcpSamples: number;
  };
  webVitals: { name: string; avgValue: number | null; samples: number }[];
};

function truncatePath(p: string, max = 36) {
  if (p.length <= max) return p;
  return `${p.slice(0, max - 1)}…`;
}

const DAY_OPTIONS = [7, 30, 90] as const;

const AnalyticsCharts = dynamic(() => import('@/components/dashboard/AnalyticsDashboardCharts'), {
  loading: () => (
    <div className="space-y-6" aria-busy="true" aria-label="Loading charts">
      <div
        className="w-full animate-pulse rounded-2xl bg-slate-100/90 dark:bg-slate-800/60"
        style={{ height: DASHBOARD_CHART_HEIGHT, minHeight: DASHBOARD_CHART_HEIGHT }}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <div
          className="animate-pulse rounded-2xl bg-slate-100/90 dark:bg-slate-800/60"
          style={{ height: DASHBOARD_CHART_HEIGHT, minHeight: DASHBOARD_CHART_HEIGHT }}
        />
        <div
          className="animate-pulse rounded-2xl bg-slate-100/90 dark:bg-slate-800/60"
          style={{ height: DASHBOARD_CHART_HEIGHT, minHeight: DASHBOARD_CHART_HEIGHT }}
        />
      </div>
    </div>
  ),
});

export default function AnalyticsDashboard({
  locale,
  viewerRole,
}: {
  locale: string;
  viewerRole: Role;
}) {
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (d: number) => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/dashboard/analytics?days=${d}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { message?: string };
        throw new Error(j.message ?? 'Failed to load');
      }
      setData((await r.json()) as AnalyticsPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(days);
  }, [days, load]);

  const lineData =
    data?.series.map((s) => ({
      label: s.date.slice(5),
      views: s.views,
    })) ?? [];

  const topBars =
    data?.topPages.map((p) => ({
      label: truncatePath(p.path),
      views: p.views,
      fullPath: p.path,
    })) ?? [];

  const newsBars =
    data?.news.topPosts.map((p) => ({
      label: truncatePath(p.path),
      views: p.views,
      fullPath: p.path,
    })) ?? [];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={publicPathForLocale(locale, '/dashboard')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 mb-2"
          >
            <ArrowLeft size={16} />
            {getDashboardTitle(viewerRole)}
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 size={28} className="text-violet-600 dark:text-violet-400" />
            Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Page views, top pages, and news URL performance from production traffic.
          </p>
        </div>
        <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800/60">
          {DAY_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                days === d
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </header>

      {data?.productionTrafficOnly ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200">
          Visits and web vitals are only recorded in production. Charts may be empty in development.
        </p>
      ) : null}

      {loading && !data ? (
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-2 py-8 text-slate-500 dark:text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
            Loading analytics…
          </div>
          <div
            className="w-full rounded-2xl bg-slate-100/90 dark:bg-slate-800/60 animate-pulse"
            style={{ height: DASHBOARD_CHART_HEIGHT, minHeight: DASHBOARD_CHART_HEIGHT }}
            aria-hidden
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <div
              className="rounded-2xl bg-slate-100/90 dark:bg-slate-800/60 animate-pulse"
              style={{ height: DASHBOARD_CHART_HEIGHT, minHeight: DASHBOARD_CHART_HEIGHT }}
              aria-hidden
            />
            <div
              className="rounded-2xl bg-slate-100/90 dark:bg-slate-800/60 animate-pulse"
              style={{ height: DASHBOARD_CHART_HEIGHT, minHeight: DASHBOARD_CHART_HEIGHT }}
              aria-hidden
            />
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/50 dark:text-rose-200">
          {error}
        </p>
      ) : null}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Page views
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                {data.totals.pageViews.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Last {data.rangeDays} days
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Globe size={14} /> Avg / day
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                {data.rangeDays > 0
                  ? Math.round(data.totals.pageViews / data.rangeDays).toLocaleString()
                  : '0'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <BookOpen size={14} /> News views
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                {data.news.totalViews.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Paths matching /news/ (and legacy /blog/)
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                News LCP (avg)
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                {data.news.lcpAvgMs != null
                  ? `${data.news.lcpAvgMs} ms`
                  : '—'}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {data.news.lcpSamples > 0
                  ? `${data.news.lcpSamples} samples on news URLs`
                  : 'No LCP samples for news paths'}
              </p>
            </div>
          </div>

          <AnalyticsCharts lineData={lineData} topBars={topBars} newsBars={newsBars} />

          <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-4">
              <Activity size={18} className="text-slate-600 dark:text-slate-400" />
              Core Web Vitals (avg)
            </h2>
            {data.webVitals.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {data.webVitals.map((m) => (
                  <div
                    key={m.name}
                    className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/40"
                  >
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{m.name}</p>
                    <p className="mt-1 text-lg font-bold tabular-nums text-slate-900 dark:text-slate-100">
                      {m.avgValue != null ? m.avgValue : '—'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {m.samples} samples
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 py-4">No web vitals in this range.</p>
            )}
          </section>
        </>
      )}

      {loading && data ? (
        <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Refreshing…
        </p>
      ) : null}
    </div>
  );
}
