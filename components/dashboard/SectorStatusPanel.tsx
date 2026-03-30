'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ToggleLeft } from 'lucide-react';
import { COMPANY_DIVISION_SLUGS } from '@/lib/company-divisions';

type SectorRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isLive: boolean;
};

export default function SectorStatusPanel() {
  const [items, setItems] = useState<SectorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingSlug, setUpdatingSlug] = useState<string | null>(null);

  const canonicalOrder = useMemo(() => new Map(COMPANY_DIVISION_SLUGS.map((s, i) => [s, i])), []);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch('/api/admin/sectors', { cache: 'no-store' });
    if (res.status === 403) {
      setError('Forbidden');
      setItems([]);
      return;
    }
    if (!res.ok) {
      setError('Could not load sectors.');
      return;
    }
    const data = (await res.json()) as { sectors?: SectorRow[] };
    const rows = (data.sectors ?? []).slice();
    rows.sort((a, b) => (canonicalOrder.get(a.slug as any) ?? 999) - (canonicalOrder.get(b.slug as any) ?? 999));
    setItems(rows);
  }, [canonicalOrder]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await load();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function toggle(slug: string, isLive: boolean) {
    setUpdatingSlug(slug);
    setError(null);
    try {
      const res = await fetch('/api/admin/sectors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, isLive }),
      });
      const json = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) throw new Error(json.message || 'Update failed');
      setItems((prev) => prev.map((s) => (s.slug === slug ? { ...s, isLive } : s)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setUpdatingSlug(null);
    }
  }

  if (loading) {
    return (
      <section className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-lg shadow-slate-200/20 p-5">
        <p className="text-sm text-slate-500">Loading sector status…</p>
      </section>
    );
  }

  return (
    <section className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-lg shadow-slate-200/20 overflow-hidden">
      <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
        <ToggleLeft size={20} className="text-slate-600" />
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Sector visibility</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            When OFF, the sector shows as “Coming soon” in the public mega-menu. When ON, it becomes clickable.
          </p>
        </div>
      </div>

      {error ? <p className="px-5 pt-3 text-sm text-red-600">{error}</p> : null}

      <ul className="divide-y divide-slate-100">
        {items.map((s) => (
          <li key={s.id} className="flex items-start justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="font-medium text-slate-900">{s.name}</p>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{s.slug}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={s.isLive}
              disabled={updatingSlug === s.slug}
              onClick={() => toggle(s.slug, !s.isLive)}
              className={`relative h-8 w-14 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50 ${
                s.isLive ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                  s.isLive ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
              <span className="sr-only">{s.isLive ? 'Disable' : 'Enable'} {s.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

