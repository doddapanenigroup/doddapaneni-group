'use client';

import { useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';

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
      <p className="rounded-xl border border-red-200 bg-white/90 p-4 text-sm text-red-600">{error}</p>
    );
  }
  if (!data) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white/90 p-4 text-sm text-slate-500">
        Loading operations overview…
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.07)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/25">
        <h2 className="flex items-center gap-2 border-b border-slate-100/95 bg-gradient-to-r from-slate-50/98 to-white p-5 text-lg font-semibold text-slate-800 dark:border-slate-800 dark:from-slate-800/45 dark:to-slate-900/85">
          Developer edits (files &amp; CMS)
        </h2>
        <ul className="max-h-64 divide-y divide-slate-100 overflow-y-auto text-sm dark:divide-slate-800">
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
                {c.summary && <span className="mt-1 block text-xs text-slate-600">{c.summary}</span>}
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.07)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/25">
        <h2 className="flex items-center gap-2 border-b border-slate-100/95 bg-gradient-to-r from-slate-50/98 to-white p-5 text-lg font-semibold text-slate-800 dark:border-slate-800 dark:from-slate-800/45 dark:to-slate-900/85">
          <Megaphone size={20} className="text-slate-600" />
          Digital marketer / SEO-related changes
        </h2>
        <ul className="max-h-64 divide-y divide-slate-100 overflow-y-auto text-sm dark:divide-slate-800">
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
                  <span className="mt-1 block text-xs text-slate-700">SEO note: {m.seoNote}</span>
                )}
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
