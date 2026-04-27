'use client';

import { useEffect, useState } from 'react';
import { Settings, RefreshCw } from 'lucide-react';
import {
  dashboardNestedCardClass,
  dashboardPanelClass,
  dashboardPanelHeaderClass,
} from '@/lib/dashboard-ui';

type EnvCheck = {
  key: string;
  label: string;
  valid: boolean;
  severity: 'required' | 'recommended';
  hint?: string;
};

type SafeEnvRow = { key: string; value: string; sensitive: boolean };

type Payload = {
  ok: boolean;
  checks: EnvCheck[];
  summary: { requiredInvalid: number; recommendedInvalid: number };
  safeEnv?: SafeEnvRow[];
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
    <section className={dashboardPanelClass}>
      <h2 className={`flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100 ${dashboardPanelHeaderClass}`}>
        <Settings size={20} className="text-slate-600" />
        Environment validation
      </h2>

      <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Required/recommended checks and a safe preview of non-secret values (sensitive keys are masked).
        </p>
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

            <div className={`overflow-hidden !p-0 ${dashboardNestedCardClass}`}>
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

            {data.safeEnv && data.safeEnv.length > 0 ? (
              <div className={`mt-4 overflow-hidden !p-0 ${dashboardNestedCardClass}`}>
                <div className="bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">Safe environment preview</div>
                <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-auto">
                  {data.safeEnv.map((row) => (
                    <li key={row.key} className="px-4 py-2.5 grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-2 text-sm">
                      <span className="font-mono text-xs text-slate-600 break-all">{row.key}</span>
                      <span
                        className={`text-xs break-all ${row.sensitive ? 'text-amber-800 dark:text-amber-200' : 'text-slate-800 dark:text-slate-200'}`}
                      >
                        {row.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}

