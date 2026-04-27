'use client';

import { useCallback, useEffect, useState } from 'react';
import { Rocket, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import {
  dashboardHeaderActionPrimary,
  dashboardHeaderActionSecondary,
  dashboardNestedCardClass,
  dashboardPanelClass,
  dashboardPanelHeaderClass,
} from '@/lib/dashboard-ui';

type DeploymentRow = {
  id: string;
  status: string;
  logs: string;
  createdAt: string;
};

export default function DeveloperBuildDeploymentsPanel() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<DeploymentRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [buildBusy, setBuildBusy] = useState(false);
  const [buildMessage, setBuildMessage] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/deployments?take=50');
      const json = (await res.json().catch(() => null)) as { items?: DeploymentRow[] } | null;
      if (!res.ok) throw new Error('Failed to load');
      setItems(json?.items ?? []);
    } catch {
      setError('Could not load deployment history');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function triggerBuild() {
    setBuildBusy(true);
    setBuildMessage(null);
    try {
      const res = await fetch('/api/build', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const json = (await res.json().catch(() => null)) as { message?: string; ok?: boolean; deployment?: { id: string; status: string } } | null;
      if (res.ok && json?.ok) {
        setBuildMessage(`Build recorded (${json.deployment?.status ?? 'ok'})`);
      } else {
        setBuildMessage(json?.message ?? `HTTP ${res.status}`);
      }
      await load();
    } catch (e) {
      setBuildMessage(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setBuildBusy(false);
    }
  }

  return (
    <section className={dashboardPanelClass}>
      <h2 className={`flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100 ${dashboardPanelHeaderClass}`}>
        <Rocket size={20} className="text-slate-600" />
        Build &amp; deployments
      </h2>
      <div className="p-5 space-y-4">
        <p className="text-sm text-slate-600">
          Creates a deployment record in the database for audit. This does not start a remote build or call an external
          service.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void triggerBuild()}
            disabled={buildBusy}
            className={`inline-flex items-center justify-center gap-2 disabled:opacity-50 ${dashboardHeaderActionPrimary}`}
          >
            <Rocket size={16} />
            {buildBusy ? 'Triggering…' : 'Trigger build'}
          </button>
          <button
            type="button"
            onClick={() => void load()}
            className={`inline-flex items-center justify-center gap-2 ${dashboardHeaderActionSecondary}`}
          >
            <RefreshCw size={16} />
            Refresh list
          </button>
          {buildMessage ? (
            <span className="text-xs text-slate-600 dark:text-slate-400">{buildMessage}</span>
          ) : null}
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading deployments…</p>
        ) : error ? (
          <p className="text-sm text-rose-600">{error}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500">No deployment records yet. Trigger a build to create one.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((d) => {
              const isOpen = openId === d.id;
              return (
                <li key={d.id} className={`!p-0 ${dashboardNestedCardClass}`}>
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : d.id)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                      {new Date(d.createdAt).toLocaleString()}{' '}
                      <span
                        className={`ml-2 text-xs px-1.5 py-0.5 rounded border ${
                          d.status === 'success' || d.status === 'recorded'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : d.status === 'error'
                              ? 'bg-rose-50 border-rose-200 text-rose-800'
                              : 'bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        {d.status}
                      </span>
                    </span>
                    {isOpen ? <ChevronDown size={16} className="shrink-0" /> : <ChevronRight size={16} className="shrink-0" />}
                  </button>
                  {isOpen ? (
                    <div className="border-t border-slate-200 px-3 py-2 dark:border-slate-700">
                      <p className="text-[11px] text-slate-500 mb-1">ID: {d.id}</p>
                      <pre className={`max-h-64 overflow-auto whitespace-pre-wrap break-words p-2 text-xs text-slate-700 dark:text-slate-300 ${dashboardNestedCardClass}`}>
                        {d.logs}
                      </pre>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
