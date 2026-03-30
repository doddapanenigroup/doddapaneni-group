'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

type Payload = {
  ts: string;
  windowMinutes: number;
  limit: number;
  summary: { distinctIps: number; distinctUsers: number };
  topIps: { ip: string; count: number; perMin: number; suspicious: boolean }[];
  topUsers: { userId: string; count: number; perMin: number; suspicious: boolean }[];
  topPaths: { key: string; count: number; perMin: number }[];
};

export default function DeveloperRequestMonitorPanel() {
  const [windowMinutes, setWindowMinutes] = useState(10);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Payload | null>(null);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('windowMinutes', String(windowMinutes));
    params.set('limit', String(limit));
    const res = await fetch(`/api/developer/request-monitor?${params.toString()}`);
    const json = (await res.json().catch(() => null)) as Payload | null;
    setData(res.ok ? json : null);
    setLoading(false);
  }

  useEffect(() => {
    load().catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.07)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/25">
      <h2 className="text-lg font-semibold text-slate-800 p-5 border-b border-slate-100/95 bg-gradient-to-r from-slate-50/98 to-white dark:border-slate-800 dark:from-slate-800/45 dark:to-slate-900/85 flex items-center gap-2">
        <ShieldAlert size={20} className="text-slate-600" />
        Request monitoring (rate-limit telemetry)
      </h2>

      <div className="p-5 border-b border-slate-100 flex flex-wrap gap-3 items-center">
        <label className="text-sm text-slate-600 flex items-center gap-2">
          Window (min)
          <input
            type="number"
            min={1}
            max={60}
            value={windowMinutes}
            onChange={(e) => setWindowMinutes(Number(e.target.value))}
            className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm text-slate-600 flex items-center gap-2">
          Limit
          <input
            type="number"
            min={5}
            max={100}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <button
          type="button"
          onClick={() => load()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-700 text-white px-4 py-2 text-sm hover:bg-slate-800"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
        {data?.ts ? (
          <span className="text-xs text-slate-500">Last snapshot: {new Date(data.ts).toLocaleString()}</span>
        ) : null}
      </div>

      <div className="p-5">
        {loading ? (
          <p className="text-sm text-slate-500">Loading request telemetry…</p>
        ) : !data ? (
          <p className="text-sm text-slate-500">Could not load telemetry.</p>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Distinct IPs" value={data.summary.distinctIps} />
              <Metric label="Distinct users" value={data.summary.distinctUsers} />
              <Metric label="Window (min)" value={data.windowMinutes} />
              <Metric label="Top list size" value={data.limit} />
            </div>

            <TableBlock
              title="Top IPs"
              rows={data.topIps.map((r) => ({
                key: r.ip,
                left: `${r.ip}`,
                right: `${r.count} (${r.perMin}/min)`,
                suspicious: r.suspicious,
              }))}
            />

            <TableBlock
              title="Top users"
              rows={data.topUsers.map((r) => ({
                key: r.userId,
                left: r.userId,
                right: `${r.count} (${r.perMin}/min)`,
                suspicious: r.suspicious,
              }))}
            />

            <TableBlock
              title="Top paths"
              rows={data.topPaths.map((r) => ({
                key: r.key,
                left: r.key,
                right: `${r.count} (${r.perMin}/min)`,
                suspicious: false,
              }))}
            />
            <p className="text-xs text-slate-500">
              Monitoring only (no blocking). Suspicious flag is a simple heuristic on sustained rate.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-900 mt-1">{value}</p>
    </div>
  );
}

function TableBlock({
  title,
  rows,
}: {
  title: string;
  rows: { key: string; left: string; right: string; suspicious: boolean }[];
}) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">{title}</div>
      <ul className="max-h-52 overflow-y-auto text-sm divide-y divide-slate-100 dark:divide-slate-800">
        {rows.length === 0 ? (
          <li className="px-4 py-2 text-slate-500">No data</li>
        ) : (
          rows.map((r) => (
            <li key={r.key} className="px-4 py-2 flex items-center justify-between gap-3">
              <span className="font-mono text-xs text-slate-700 truncate">{r.left}</span>
              <span
                className={`text-xs font-mono ${
                  r.suspicious ? 'text-rose-700 bg-rose-50 border border-rose-100 px-2 py-1 rounded' : 'text-slate-600'
                }`}
              >
                {r.right}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

