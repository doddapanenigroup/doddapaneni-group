'use client';

import { useEffect, useState } from 'react';
import { Settings, RefreshCw } from 'lucide-react';

type EnvCheck = {
  key: string;
  label: string;
  valid: boolean;
  severity: 'required' | 'recommended';
  hint?: string;
};

type Payload = {
  ok: boolean;
  checks: EnvCheck[];
  summary: { requiredInvalid: number; recommendedInvalid: number };
};

export default function DeveloperEnvPanel() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Payload | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/developer/env');
    const json = (await res.json().catch(() => null)) as Payload | null;
    setData(res.ok ? json : null);
    setLoading(false);
  }

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, []);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.07)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/25">
      <h2 className="text-lg font-semibold text-slate-800 p-5 border-b border-slate-100/95 bg-gradient-to-r from-slate-50/98 to-white dark:border-slate-800 dark:from-slate-800/45 dark:to-slate-900/85 flex items-center gap-2">
        <Settings size={20} className="text-slate-600" />
        Environment validation
      </h2>

      <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600">Shows missing/invalid env configuration (secrets not displayed).</p>
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
          <p className="text-sm text-slate-500">Loading env status…</p>
        ) : !data ? (
          <p className="text-sm text-slate-500">Could not load env status.</p>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-xs px-2 py-1 rounded border ${
                  data.ok ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
                }`}
              >
                {data.ok ? 'Valid' : 'Invalid'}
              </span>
              <span className="text-xs text-slate-500">
                Required issues: {data.summary.requiredInvalid} • Recommended issues: {data.summary.recommendedInvalid}
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">Checks</div>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.checks.map((c) => (
                  <li key={c.key} className="px-4 py-3 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800">{c.label}</p>
                      <p className="text-xs text-slate-500 font-mono">{c.key}</p>
                      {c.hint ? <p className="text-xs text-slate-600 mt-1">{c.hint}</p> : null}
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded border ${
                          c.valid ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
                        }`}
                      >
                        {c.valid ? 'Valid' : 'Invalid'}
                      </span>
                      <span className="text-[11px] text-slate-500">{c.severity}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

