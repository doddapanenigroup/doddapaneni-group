'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, Filter } from 'lucide-react';

type UserFilter = { id: string; email: string; name: string | null; role: string };
type Payload = {
  users: UserFilter[];
  summary: { loginLogs: number; pageViews: number; webVitals: number; visits: number };
  loginLogs: { id: string; userEmail: string; userRole: string; loggedAt: string }[];
  pageViews: { id: string; path: string; visitedAt: string }[];
  webVitals: { id: string; name: string; value: number; rating: string | null; pagePath: string | null; createdAt: string }[];
  visits: { id: string; visitedAt: string; pagePath: string | null; ipAddress: string | null }[];
};

export default function DeveloperObservabilityPanel() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Payload | null>(null);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (userId) params.set('userId', userId);
    if (role) params.set('role', role);
    const res = await fetch(`/api/developer/observability?${params.toString()}`);
    const json = (await res.json().catch(() => null)) as Payload | null;
    setData(res.ok ? json : null);
    setLoading(false);
  }

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, []);

  const users = useMemo(() => data?.users ?? [], [data]);

  return (
    <section className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200/80 shadow-lg overflow-hidden">
      <h2 className="text-lg font-semibold text-slate-800 p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
        <Activity size={20} className="text-slate-600" />
        Developer observability
      </h2>

      <div className="p-5 border-b border-slate-100 grid gap-3 md:grid-cols-5">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">All roles</option>
          <option value="DEVELOPER">Developer</option>
          <option value="ADMIN">Admin</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </select>
        <select value={userId} onChange={(e) => setUserId(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">All users</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.email} ({u.role})
            </option>
          ))}
        </select>
        <button type="button" onClick={() => load()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-700 text-white px-4 py-2 text-sm hover:bg-slate-800">
          <Filter size={16} />
          Apply filters
        </button>
      </div>

      <div className="p-5">
        {loading ? (
          <p className="text-sm text-slate-500">Loading observability data…</p>
        ) : !data ? (
          <p className="text-sm text-slate-500">Could not load data.</p>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Login logs" value={data.summary.loginLogs} />
              <Metric label="Page views" value={data.summary.pageViews} />
              <Metric label="Web vitals" value={data.summary.webVitals} />
              <Metric label="Visits" value={data.summary.visits} />
            </div>

            <TableBlock title="LoginLog (user activity)" rows={data.loginLogs.map((r) => `${new Date(r.loggedAt).toLocaleString()} — ${r.userEmail} (${r.userRole})`)} />
            <TableBlock title="DeveloperPageView (page tracking)" rows={data.pageViews.map((r) => `${new Date(r.visitedAt).toLocaleString()} — ${r.path}`)} />
            <TableBlock title="WebVitalReport (performance)" rows={data.webVitals.map((r) => `${new Date(r.createdAt).toLocaleString()} — ${r.name}: ${r.value} ${r.rating ? `(${r.rating})` : ''}`)} />
            <TableBlock title="Visit (traffic)" rows={data.visits.map((r) => `${new Date(r.visitedAt).toLocaleString()} — ${r.pagePath ?? '/'} ${r.ipAddress ? `(${r.ipAddress})` : ''}`)} />
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

function TableBlock({ title, rows }: { title: string; rows: string[] }) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">{title}</div>
      <ul className="max-h-52 overflow-y-auto text-sm divide-y divide-slate-100">
        {rows.length === 0 ? (
          <li className="px-4 py-2 text-slate-500">No data</li>
        ) : (
          rows.map((r, i) => (
            <li key={`${title}-${i}`} className="px-4 py-2 text-slate-700 font-mono text-xs">
              {r}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

