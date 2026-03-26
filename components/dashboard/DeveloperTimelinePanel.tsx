'use client';

import { useEffect, useMemo, useState } from 'react';
import { Clock, Filter } from 'lucide-react';

type User = { id: string; email: string; name: string | null; role: string };
type Item = {
  id: string;
  ts: string;
  source: 'ContentEditLog' | 'MarketingActivityLog';
  userId: string;
  userEmail: string;
  userRole: string;
  action: string;
  title: string;
  detail: string | null;
};

type Payload = { users: User[]; items: Item[] };

export default function DeveloperTimelinePanel() {
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Payload | null>(null);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (userId) params.set('userId', userId);
    if (role) params.set('role', role);
    params.set('take', '120');
    const res = await fetch(`/api/developer/timeline?${params.toString()}`);
    const json = (await res.json().catch(() => null)) as Payload | null;
    setData(res.ok ? json : null);
    setLoading(false);
  }

  useEffect(() => {
    load().catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const users = useMemo(() => data?.users ?? [], [data]);
  const items = useMemo(() => data?.items ?? [], [data]);

  return (
    <section className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-700/50 shadow-lg shadow-slate-200/20 dark:shadow-black/40 overflow-hidden">
      <h2 className="text-lg font-semibold text-slate-800 p-5 border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40 flex items-center gap-2">
        <Clock size={20} className="text-slate-600" />
        Activity timeline
      </h2>

      <div className="p-5 border-b border-slate-100 grid gap-3 md:grid-cols-4">
        <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">All roles</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="ADMIN">Admin</option>
          <option value="DEVELOPER">Developer</option>
          <option value="DIGITAL_MARKETER">Digital Marketer</option>
        </select>
        <select value={userId} onChange={(e) => setUserId(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2">
          <option value="">All users</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.email} ({u.role})
            </option>
          ))}
        </select>
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
          <p className="text-sm text-slate-500">Loading timeline…</p>
        ) : !data ? (
          <p className="text-sm text-slate-500">Could not load timeline.</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500">No activity found.</p>
        ) : (
          <ol className="space-y-3">
            {items.map((i) => (
              <li key={i.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">
                      {new Date(i.ts).toLocaleString()} — {i.userEmail} ({i.userRole})
                    </p>
                    <p className="text-sm font-semibold text-slate-800 mt-1">{i.action}</p>
                    <p className="text-sm text-slate-700 mt-1 break-words">{i.title}</p>
                    {i.detail ? (
                      <p className="text-xs text-slate-600 mt-2 break-words">{i.detail}</p>
                    ) : null}
                  </div>
                  <span className="text-[11px] px-2 py-1 rounded border border-slate-200 bg-slate-50 text-slate-600">
                    {i.source}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

