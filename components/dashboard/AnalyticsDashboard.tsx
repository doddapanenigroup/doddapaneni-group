'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Globe,
  LineChart as LineChartIcon,
  Activity,
  Loader2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

export type AnalyticsPayload = {
  rangeDays: number;
  since: string;
  until: string;
  productionTrafficOnly: boolean;
  totals: { pageViews: number; blogViews: number };
  series: { date: string; views: number }[];
  topPages: { path: string; views: number }[];
  blog: {
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

export default function AnalyticsDashboard({ locale }: { locale: string }) {
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

  const blogBars =
    data?.blog.topPosts.map((p) => ({
      label: truncatePath(p.path),
      views: p.views,
      fullPath: p.path,
    })) ?? [];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={`/${locale}/dashboard`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 mb-2"
          >
            <ArrowLeft size={16} />
            Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 size={28} className="text-violet-600 dark:text-violet-400" />
            Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Page views, top pages, and blog performance from production traffic.
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
        <div className="flex items-center justify-center py-24 text-slate-500 gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          Loading analytics…
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
                <BookOpen size={14} /> Blog views
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                {data.blog.totalViews.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Paths matching /blog/
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Blog LCP (avg)
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                {data.blog.lcpAvgMs != null
                  ? `${data.blog.lcpAvgMs} ms`
                  : '—'}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {data.blog.lcpSamples > 0
                  ? `${data.blog.lcpSamples} samples on blog URLs`
                  : 'No LCP samples for blog paths'}
              </p>
            </div>
          </div>

          <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-4">
              <LineChartIcon size={18} className="text-slate-600 dark:text-slate-400" />
              Page views by day
            </h2>
            <div className="h-72 w-full min-w-0">
              {lineData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#33415522" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#64748b" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#64748b" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8 }}
                      formatter={(v: number | undefined) => [(v ?? 0).toLocaleString(), 'Views']}
                      labelFormatter={(l) => `Day ${l}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="views"
                      stroke="#7c3aed"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-slate-500 py-12 text-center">No views in this range.</p>
              )}
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-4">
                <BarChart3 size={18} className="text-slate-600 dark:text-slate-400" />
                Top pages
              </h2>
              <div className="h-[min(28rem,50vh)] w-full min-w-0">
                {topBars.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={topBars}
                      margin={{ left: 4, right: 16, top: 8, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#33415522" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} stroke="#64748b" allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="label"
                        width={132}
                        tick={{ fontSize: 10 }}
                        stroke="#64748b"
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: 8 }}
                        formatter={(v: number | undefined) => [(v ?? 0).toLocaleString(), 'Views']}
                        labelFormatter={(_, payload) =>
                          (payload?.[0]?.payload as { fullPath?: string })?.fullPath ?? ''
                        }
                      />
                      <Bar dataKey="views" fill="#475569" radius={[0, 4, 4, 0]} name="Views" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-slate-500 py-12 text-center">No page paths recorded.</p>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-4">
                <BookOpen size={18} className="text-slate-600 dark:text-slate-400" />
                Blog performance
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Views by blog URL (from public site tracking). Web Vitals LCP average for blog URLs
                shown in summary cards.
              </p>
              <div className="h-[min(28rem,50vh)] w-full min-w-0">
                {blogBars.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={blogBars}
                      margin={{ left: 4, right: 16, top: 8, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#33415522" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} stroke="#64748b" allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="label"
                        width={132}
                        tick={{ fontSize: 10 }}
                        stroke="#64748b"
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: 8 }}
                        formatter={(v: number | undefined) => [(v ?? 0).toLocaleString(), 'Views']}
                        labelFormatter={(_, payload) =>
                          (payload?.[0]?.payload as { fullPath?: string })?.fullPath ?? ''
                        }
                      />
                      <Bar dataKey="views" fill="#7c3aed" radius={[0, 4, 4, 0]} name="Views" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-slate-500 py-12 text-center">No blog traffic in this range.</p>
                )}
              </div>
            </section>
          </div>

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
