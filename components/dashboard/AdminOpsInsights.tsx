'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Globe, Megaphone, Timer } from 'lucide-react';

type Insights = {
  contentEdits: {
    id: string;
    createdAt: string;
    userEmail: string;
    userRole: string;
    kind: string;
    targetPath: string;
    summary: string | null;
  }[];
  marketingActivity: {
    id: string;
    createdAt: string;
    userEmail: string;
    userRole: string;
    entity: string;
    action: string;
    seoNote: string | null;
  }[];
  visitsLast7Days: number;
  dashboardVisitsByRole: { role: string; count: number }[];
  webVitals7d: { name: string; avgValue: number | null; samples: number }[];
};

export default function AdminOpsInsights() {
  const [data, setData] = useState<Insights | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/dashboard/admin-insights')
      .then(async (r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then((json: unknown) => setData(json as Insights))
      .catch(() => setError('Could not load admin insights'));
  }, []);

  if (error) {
    return (
      <p className="text-sm text-red-600 bg-white/90 rounded-xl border border-red-200 p-4">{error}</p>
    );
  }
  if (!data) {
    return (
      <p className="text-sm text-slate-500 bg-white/90 rounded-xl border border-slate-200 p-4">
        Loading operations overview…
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.07)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/25">
        <h2 className="text-lg font-semibold text-slate-800 p-5 border-b border-slate-100/95 bg-gradient-to-r from-slate-50/98 to-white dark:border-slate-800 dark:from-slate-800/45 dark:to-slate-900/85 flex items-center gap-2">
          <BarChart3 size={20} className="text-slate-600" />
          Traffic &amp; performance (7 days)
        </h2>
        <div className="p-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500 flex items-center gap-1">
              <Globe size={14} /> Public visits
            </p>
            <p className="text-2xl font-semibold text-slate-900 mt-1">{data.visitsLast7Days}</p>
          </div>
          {data.webVitals7d.map((w) => (
            <div key={w.name} className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500 flex items-center gap-1">
                <Timer size={14} /> {w.name} (avg)
              </p>
              <p className="text-2xl font-semibold text-slate-900 mt-1">
                {w.avgValue != null ? Math.round(w.avgValue * 100) / 100 : '—'}
              </p>
              <p className="text-xs text-slate-500 mt-1">{w.samples} samples</p>
            </div>
          ))}
        </div>
        {data.dashboardVisitsByRole.length > 0 && (
          <div className="px-5 pb-5">
            <p className="text-xs font-medium text-slate-600 mb-2">Dashboard opens by role (7d)</p>
            <ul className="flex flex-wrap gap-2">
              {data.dashboardVisitsByRole.map((d) => (
                <li
                  key={d.role}
                  className="text-xs px-2 py-1 rounded-lg bg-slate-200/80 text-slate-800"
                >
                  {d.role}: {d.count}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.07)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/25">
        <h2 className="text-lg font-semibold text-slate-800 p-5 border-b border-slate-100/95 bg-gradient-to-r from-slate-50/98 to-white dark:border-slate-800 dark:from-slate-800/45 dark:to-slate-900/85">
          Developer edits (files &amp; CMS)
        </h2>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto text-sm">
          {data.contentEdits.length === 0 ? (
            <li className="p-4 text-slate-500">No edits recorded yet.</li>
          ) : (
            data.contentEdits.map((c) => (
              <li key={c.id} className="p-4">
                <span className="font-mono text-xs text-slate-600">{c.kind}</span>{' '}
                <span className="font-medium">{c.targetPath}</span>
                <span className="text-slate-500"> · {c.userEmail}</span>
                <br />
                <span className="text-xs text-slate-500">{new Date(c.createdAt).toLocaleString()}</span>
                {c.summary && <span className="text-xs text-slate-600 block mt-1">{c.summary}</span>}
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.07)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/25">
        <h2 className="text-lg font-semibold text-slate-800 p-5 border-b border-slate-100/95 bg-gradient-to-r from-slate-50/98 to-white dark:border-slate-800 dark:from-slate-800/45 dark:to-slate-900/85 flex items-center gap-2">
          <Megaphone size={20} className="text-slate-600" />
          Digital marketer / SEO-related changes
        </h2>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto text-sm">
          {data.marketingActivity.length === 0 ? (
            <li className="p-4 text-slate-500">No marketing activity logged yet.</li>
          ) : (
            data.marketingActivity.map((m) => (
              <li key={m.id} className="p-4">
                <span className="font-medium capitalize">{m.action}</span>{' '}
                <span className="text-slate-600">{m.entity}</span>
                <span className="text-slate-500"> · {m.userEmail}</span>
                <br />
                <span className="text-xs text-slate-500">{new Date(m.createdAt).toLocaleString()}</span>
                {m.seoNote && (
                  <span className="text-xs text-slate-700 block mt-1">SEO note: {m.seoNote}</span>
                )}
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
