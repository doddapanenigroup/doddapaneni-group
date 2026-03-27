'use client';

import {
  BarChart3,
  BookOpen,
  LineChart as LineChartIcon,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  DASHBOARD_CHART_HEIGHT,
  SafeResponsiveChart,
} from '@/components/dashboard/SafeResponsiveChart';

export type AnalyticsLinePoint = { label: string; views: number };
export type AnalyticsBarRow = { label: string; views: number; fullPath: string };

type Props = {
  lineData: AnalyticsLinePoint[];
  topBars: AnalyticsBarRow[];
  blogBars: AnalyticsBarRow[];
};

export default function AnalyticsDashboardCharts({ lineData, topBars, blogBars }: Props) {
  return (
    <>
      <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
          <LineChartIcon size={18} className="text-slate-600 dark:text-slate-400" />
          Page views by day
        </h2>
        <div className="w-full min-w-0" style={{ minHeight: DASHBOARD_CHART_HEIGHT }}>
          {lineData.length > 0 ? (
            <SafeResponsiveChart height={DASHBOARD_CHART_HEIGHT}>
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
            </SafeResponsiveChart>
          ) : (
            <div
              className="flex items-center justify-center text-sm text-slate-500 dark:text-slate-400"
              style={{ height: DASHBOARD_CHART_HEIGHT, minHeight: DASHBOARD_CHART_HEIGHT }}
            >
              No views in this range.
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
            <BarChart3 size={18} className="text-slate-600 dark:text-slate-400" />
            Top pages
          </h2>
          <div className="w-full min-w-0" style={{ minHeight: DASHBOARD_CHART_HEIGHT }}>
            {topBars.length > 0 ? (
              <SafeResponsiveChart height={DASHBOARD_CHART_HEIGHT}>
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
              </SafeResponsiveChart>
            ) : (
              <div
                className="flex items-center justify-center text-sm text-slate-500 dark:text-slate-400"
                style={{ height: DASHBOARD_CHART_HEIGHT, minHeight: DASHBOARD_CHART_HEIGHT }}
              >
                No page paths recorded.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
            <BookOpen size={18} className="text-slate-600 dark:text-slate-400" />
            Blog performance
          </h2>
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
            Views by blog URL (from public site tracking). Web Vitals LCP average for blog URLs shown
            in summary cards.
          </p>
          <div className="w-full min-w-0" style={{ minHeight: DASHBOARD_CHART_HEIGHT }}>
            {blogBars.length > 0 ? (
              <SafeResponsiveChart height={DASHBOARD_CHART_HEIGHT}>
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
              </SafeResponsiveChart>
            ) : (
              <div
                className="flex items-center justify-center text-sm text-slate-500 dark:text-slate-400"
                style={{ height: DASHBOARD_CHART_HEIGHT, minHeight: DASHBOARD_CHART_HEIGHT }}
              >
                No blog traffic in this range.
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
