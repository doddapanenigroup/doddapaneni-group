'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  CalendarRange,
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
const MAX_CUSTOM_RANGE = 90;

type AnalyticsQuery =
  | { kind: 'preset'; days: (typeof DAY_OPTIONS)[number] }
  | { kind: 'custom'; since: string; until: string };

function ymdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addCalendarDays(d: Date, days: number): Date {
  const o = new Date(d);
  o.setDate(o.getDate() + days);
  return o;
}

function inclusiveLocalDays(since: string, until: string): number {
  const [y1, m1, d1] = since.split('-').map(Number);
  const [y2, m2, d2] = until.split('-').map(Number);
  if (![y1, m1, d1, y2, m2, d2].every((n) => Number.isFinite(n))) return 0;
  const a = new Date(y1, m1 - 1, d1);
  const b = new Date(y2, m2 - 1, d2);
  if (a > b) return 0;
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000) + 1;
}

function formatAnalyticsRange(sinceIso: string, untilIso: string) {
  const s = new Date(sinceIso);
  const u = new Date(untilIso);
  const o: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  return `${s.toLocaleDateString(undefined, o)} – ${u.toLocaleDateString(undefined, o)}`;
}

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
  const [query, setQuery] = useState<AnalyticsQuery>({ kind: 'preset', days: 30 });
  const toYmd = useCallback(() => ymdLocal(new Date()), []);
  const from30dYmd = useCallback(() => ymdLocal(addCalendarDays(new Date(), -29)), []);

  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customDraft, setCustomDraft] = useState({ since: from30dYmd(), until: toYmd() });
  const [clientRangeError, setClientRangeError] = useState<string | null>(null);

  const load = useCallback(async (q: AnalyticsQuery) => {
    setLoading(true);
    setError(null);
    setClientRangeError(null);
    try {
      const url =
        q.kind === 'preset'
          ? `/api/dashboard/analytics?days=${q.days}`
          : `/api/dashboard/analytics?since=${encodeURIComponent(q.since)}&until=${encodeURIComponent(
              q.until
            )}`;
      const r = await fetch(url, {
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
    void load(query);
  }, [query, load]);

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
        <div className="flex flex-col items-end gap-2 sm:items-end">
          <div className="flex flex-wrap justify-end gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800/60">
            {DAY_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setQuery({ kind: 'preset', days: d })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  query.kind === 'preset' && query.days === d
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {d}d
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                const until = toYmd();
                const since = ymdLocal(addCalendarDays(new Date(), -29));
                setCustomDraft({ since, until });
                setQuery({ kind: 'custom', since, until });
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                query.kind === 'custom'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <CalendarRange size={16} className="opacity-90" />
              Custom
            </button>
          </div>
          {query.kind === 'custom' ? (
            <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 dark:border-slate-600 dark:bg-slate-900/80 sm:flex-row sm:items-end">
              <label className="flex flex-1 min-w-0 flex-col gap-0.5 text-left">
                <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  From
                </span>
                <input
                  type="date"
                  value={customDraft.since}
                  max={customDraft.until}
                  onChange={(e) => setCustomDraft((p) => ({ ...p, since: e.target.value }))}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              </label>
              <label className="flex flex-1 min-w-0 flex-col gap-0.5 text-left">
                <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  To
                </span>
                <input
                  type="date"
                  value={customDraft.until}
                  min={customDraft.since}
                  max={toYmd()}
                  onChange={(e) => setCustomDraft((p) => ({ ...p, until: e.target.value }))}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  setClientRangeError(null);
                  const { since, until } = customDraft;
                  if (!since || !until) {
                    setClientRangeError('Select start and end dates');
                    return;
                  }
                  if (since > until) {
                    setClientRangeError('Start date must be on or before end date');
                    return;
                  }
                  if (inclusiveLocalDays(since, until) > MAX_CUSTOM_RANGE) {
                    setClientRangeError(`Range is limited to ${MAX_CUSTOM_RANGE} days`);
                    return;
                  }
                  if (until > toYmd()) {
                    setClientRangeError('End date cannot be in the future');
                    return;
                  }
                  setQuery({ kind: 'custom', since, until });
                }}
                className="w-full rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700 sm:w-auto sm:self-stretch"
              >
                Apply
              </button>
            </div>
          ) : null}
          {clientRangeError ? (
            <p className="max-w-sm text-right text-xs text-rose-600 dark:text-rose-400">{clientRangeError}</p>
          ) : null}
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
                {data.rangeDays === 1 ? '1 day' : `${data.rangeDays} days`} ·{' '}
                {formatAnalyticsRange(data.since, data.until)}
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
