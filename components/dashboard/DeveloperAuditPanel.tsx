'use client';

import { useEffect, useMemo, useState } from 'react';

type AuditItem = {
  id: string;
  createdAt: string;
  actorUserId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  targetLabel: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  payloadJson: string | null;
};

export default function DeveloperAuditPanel() {
  const [items, setItems] = useState<AuditItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  const query = useMemo(() => {
    const p = new URLSearchParams();
    p.set('take', '200');
    if (actionFilter.trim()) p.set('action', actionFilter.trim());
    return p.toString();
  }, [actionFilter]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/developer/audit?${query}`)
      .then(async (r) => {
        if (!r.ok) throw new Error('Failed');
        const data = (await r.json()) as { items: AuditItem[] };
        setItems(data.items ?? []);
      })
      .catch(() => setError('Could not load audit logs'))
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.07)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/25">
      <div className="p-5 border-b border-slate-100/95 bg-gradient-to-r from-slate-50/98 to-white dark:border-slate-800 dark:from-slate-800/45 dark:to-slate-900/85 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Audit log</h2>
          <p className="text-xs text-slate-500 mt-1">Critical actions (append-only, immutable).</p>
        </div>
        <input
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          placeholder="Filter by action (e.g. user.delete)"
          className="w-72 max-w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        />
      </div>

      {error ? <p className="p-4 text-sm text-red-600">{error}</p> : null}
      {loading ? <p className="p-4 text-sm text-slate-500">Loading audit logs…</p> : null}

      {!loading && !error ? (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[520px] overflow-y-auto">
          {items.length === 0 ? (
            <li className="p-4 text-sm text-slate-500">No entries yet.</li>
          ) : (
            items.map((a) => (
              <li key={a.id} className="p-4 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 break-words">{a.action}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(a.createdAt).toLocaleString()} · {a.actorEmail ?? 'Unknown'} ·{' '}
                      {a.actorRole ?? '—'} · {a.ipAddress ?? '—'}
                    </p>
                    <p className="text-xs text-slate-600 mt-1 break-words">
                      Target: {a.targetType ?? '—'}
                      {a.targetLabel ? ` · ${a.targetLabel}` : ''}
                      {a.targetId ? ` · ${a.targetId}` : ''}
                    </p>
                    {a.payloadJson ? (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-slate-600">Payload</summary>
                        <pre className="mt-2 text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 overflow-auto">
                          {a.payloadJson}
                        </pre>
                      </details>
                    ) : null}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </section>
  );
}

