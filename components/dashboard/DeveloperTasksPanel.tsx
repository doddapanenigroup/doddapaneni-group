'use client';

import { useEffect, useState } from 'react';
import { Timer, RefreshCw } from 'lucide-react';

type Item = {
  id: string;
  taskName: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  message: string | null;
  detailsJson: string | null;
};

type Payload = { items: Item[] };

export default function DeveloperTasksPanel() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Payload | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/developer/tasks?take=60');
    const json = (await res.json().catch(() => null)) as Payload | null;
    setData(res.ok ? json : null);
    setLoading(false);
  }

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, []);

  const items = data?.items ?? [];

  return (
    <section className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-700/50 shadow-lg shadow-slate-200/20 dark:shadow-black/40 overflow-hidden">
      <h2 className="text-lg font-semibold text-slate-800 p-5 border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40 flex items-center gap-2">
        <Timer size={20} className="text-slate-600" />
        Scheduled tasks (execution log)
      </h2>

      <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600">Latest task runs (success/error/skipped).</p>
        <button
          type="button"
          onClick={() => load()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-700 text-white px-4 py-2 text-sm hover:bg-slate-800"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="p-5">
        {loading ? (
          <p className="text-sm text-slate-500">Loading task logs…</p>
        ) : !data ? (
          <p className="text-sm text-slate-500">Could not load task logs.</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500">No task runs yet.</p>
        ) : (
          <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
            {items.map((t) => (
              <div key={t.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="p-3 border-b border-slate-100 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">
                      {new Date(t.startedAt).toLocaleString()}
                      {t.durationMs !== null ? ` — ${t.durationMs}ms` : ''}
                    </p>
                    <p className="text-sm font-medium text-slate-800 mt-1">{t.taskName}</p>
                    <p
                      className={`text-xs mt-1 inline-flex px-2 py-0.5 rounded border ${
                        t.status === 'success'
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                          : t.status === 'error'
                          ? 'bg-rose-50 border-rose-100 text-rose-700'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      {t.status}
                    </p>
                    {t.message ? <p className="text-xs text-slate-600 mt-2 break-words">{t.message}</p> : null}
                  </div>
                </div>

                {t.detailsJson ? (
                  <details className="p-3">
                    <summary className="cursor-pointer text-xs text-slate-600 hover:text-slate-800">View details</summary>
                    <pre className="mt-2 text-[11px] text-slate-700 whitespace-pre-wrap break-words">{t.detailsJson}</pre>
                  </details>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

