'use client';

import { useEffect, useState } from 'react';
import { Globe, TrendingUp, Calendar } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { SafeResponsiveChart, DASHBOARD_CHART_HEIGHT } from '@/components/dashboard/SafeResponsiveChart';

type VisitStatsData = {
  total: number;
  firstVisitAt: string | null;
  averagePerMonth: number;
  averagePerYear: number;
  visitsByMonth: { month: string; count: number }[];
  visitsByYear: { year: string; count: number }[];
};

const CHART_COLORS = ['#475569', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0', '#f1f5f9', '#334155', '#475569'];

export default function VisitStats() {
  const [stats, setStats] = useState<VisitStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/visits/stats')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setStats(data ?? null);
      })
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-700/50 shadow-lg shadow-slate-200/20 dark:shadow-black/40 p-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
          <Globe size={22} />
          Website visits
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Loading visit statistics…</p>
        <div className="grid gap-6 lg:grid-cols-2">
          <div
            className="rounded-xl bg-slate-100/90 dark:bg-slate-800/60 animate-pulse"
            style={{ height: DASHBOARD_CHART_HEIGHT, minHeight: DASHBOARD_CHART_HEIGHT }}
            aria-hidden
          />
          <div
            className="rounded-xl bg-slate-100/90 dark:bg-slate-800/60 animate-pulse"
            style={{ height: DASHBOARD_CHART_HEIGHT, minHeight: DASHBOARD_CHART_HEIGHT }}
            aria-hidden
          />
        </div>
      </section>
    );
  }

  if (!stats) {
    return (
      <section className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-700/50 shadow-lg shadow-slate-200/20 dark:shadow-black/40 p-6">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
          <Globe size={22} />
          Website visits
        </h2>
        <p className="text-slate-500 text-sm">Unable to load visit stats.</p>
      </section>
    );
  }

  const sinceText = stats.firstVisitAt
    ? new Date(stats.firstVisitAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  const barData = stats.visitsByMonth.slice(-12).reverse().map(({ month, count }) => ({ name: month, visits: count }));
  const pieData = stats.visitsByYear.map(({ year, count }) => ({ name: year, value: count }));

  return (
    <section className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-700/50 shadow-lg shadow-slate-200/20 dark:shadow-black/40 overflow-hidden">
      <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 p-5 border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40">
        <Globe size={22} className="text-slate-600" />
        Website visit statistics
      </h2>
      <div className="p-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 p-4 border border-slate-200/60 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total (from start)</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</p>
          <p className="mt-0.5 text-xs text-slate-500">Since {sinceText}</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 p-4 border border-slate-200/60 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Average per month</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.averagePerMonth.toFixed(1)}</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 p-4 border border-slate-200/60 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Average per year</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.averagePerYear.toFixed(1)}</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 p-4 border border-slate-200/60 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">First visit</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{sinceText}</p>
        </div>
      </div>

      {(stats.visitsByMonth.length > 0 || stats.visitsByYear.length > 0) && (
        <div className="p-5 border-t border-slate-100 grid gap-6 lg:grid-cols-2">
          {barData.length > 0 && (
            <div className="rounded-xl bg-slate-50/80 p-4 border border-slate-200/60">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <TrendingUp size={16} className="text-slate-600" />
                Visits by month (last 12)
              </h3>
              <SafeResponsiveChart height={DASHBOARD_CHART_HEIGHT}>
                <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#64748b" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#64748b" />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    formatter={(value: number | undefined) => [value ?? 0, 'Visits']}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Bar dataKey="visits" fill="#64748b" radius={[4, 4, 0, 0]} name="Visits" />
                </BarChart>
              </SafeResponsiveChart>
            </div>
          )}
          {pieData.length > 0 && (
            <div className="rounded-xl bg-slate-50/80 p-4 border border-slate-200/60">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Calendar size={16} className="text-slate-600" />
                Visits by year
              </h3>
              <SafeResponsiveChart height={DASHBOARD_CHART_HEIGHT}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    formatter={(value: number | undefined) => [value ?? 0, 'Visits']}
                  />
                  <Legend />
                </PieChart>
              </SafeResponsiveChart>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
