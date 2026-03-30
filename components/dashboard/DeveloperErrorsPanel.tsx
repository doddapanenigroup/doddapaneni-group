'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Filter } from 'lucide-react';

type ErrorItem = {
  id: string;
  createdAt: string;
  message: string;
  stackTrace: string | null;
  path: string | null;
  method: string | null;
  statusCode: number | null;
  userEmail: string | null;
  userRole: string | null;
};

type Payload = {
  filters: { from: string | null; to: string | null; take: number };
  items: ErrorItem[];
};

export default function DeveloperErrorsPanel() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [take, setTake] = useState(50);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Payload | null>(null);

  const takeClamped = useMemo(() => Math.min(200, Math.max(10, take)), [take]);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    params.set('take', String(takeClamped));

    const res = await fetch(`/api/developer/errors?${params.toString()}`);
    const json = (await res.json().catch(() => null)) as Payload | null;
    setData(res.ok ? json : null);
    setLoading(false);
  }

  useEffect(() => {
    load().catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = data?.items ?? [];

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.07)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/25">
      <h2 className="text-lg font-semibold text-slate-800 p-5 border-b border-slate-100/95 bg-gradient-to-r from-slate-50/98 to-white dark:border-slate-800 dark:from-slate-800/45 dark:to-slate-900/85 flex items-center gap-2">
        <AlertTriangle size={20} className="text-slate-600" />
        Error monitoring (ErrorLog)
      </h2>

      <div className="p-5 border-b border-slate-100 grid gap-3 md:grid-cols-4">
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="number"
          value={take}
          onChange={(e) => setTake(Number(e.target.value))}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          min={10}
          max={200}
        />
        <button
          type="button"
          onClick={() => load()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-700 text-white px-4 py-2 text-sm hover:bg-slate-800"
        >
          <Filter size={16} />
          Apply filters
        </button>
      </div>

      <div className="p-5">
        {loading ? (
          <p className="text-sm text-slate-500">Loading errors…</p>
        ) : !data ? (
          <p className="text-sm text-slate-500">Could not load errors.</p>
        ) : (
          <div className="space-y-4">
            {items.length === 0 ? (
              <p className="text-sm text-slate-500">No errors found.</p>
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
                {items.map((e) => (
                  <div key={e.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                    <div className="p-3 border-b border-slate-100 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500">
                          {new Date(e.createdAt).toLocaleString()} {e.method ? `— ${e.method}` : ''}{' '}
                          {e.path ? `— ${e.path}` : ''} {e.statusCode ? `— ${e.statusCode}` : ''}
                        </p>
                        <p className="text-sm text-slate-800 font-medium mt-1 break-words">{e.message}</p>
                        {(e.userEmail || e.userRole) && (
                          <p className="text-xs text-slate-500 mt-1">
                            User: {e.userEmail ?? '—'} {e.userRole ? `(${e.userRole})` : ''}
                          </p>
                        )}
                      </div>
                    </div>

                    {e.stackTrace ? (
                      <details className="p-3">
                        <summary className="cursor-pointer text-xs text-slate-600 hover:text-slate-800">View stack trace</summary>
                        <pre className="mt-2 text-[11px] text-slate-700 whitespace-pre-wrap break-words">
                          {e.stackTrace}
                        </pre>
                      </details>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

