'use client';

import { useCallback, useEffect, useState } from 'react';
import { Rocket, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';

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
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.07)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/25">
      <h2 className="text-lg font-semibold text-slate-800 p-5 border-b border-slate-100/95 bg-gradient-to-r from-slate-50/98 to-white dark:border-slate-800 dark:from-slate-800/45 dark:to-slate-900/85 flex items-center gap-2">
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
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-800 text-white px-4 py-2 text-sm font-medium hover:bg-slate-900 disabled:opacity-50"
          >
            <Rocket size={16} />
            {buildBusy ? 'Triggering…' : 'Trigger build'}
          </button>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900"
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
                <li key={d.id} className="rounded-xl border border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-800/30">
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
                      <pre className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words max-h-64 overflow-auto rounded bg-white dark:bg-slate-950 p-2 border border-slate-200 dark:border-slate-700">
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
