'use client';

import { useCallback, useEffect, useState } from 'react';
import { ToggleLeft } from 'lucide-react';
import { pickCanonicalSectorRows } from '@/lib/company-divisions';

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
    const rows = pickCanonicalSectorRows(data.sectors ?? []);
    setItems(rows);
  }, []);

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
    const key = slug.trim().toLowerCase();
    setUpdatingSlug(key);
    setError(null);
    try {
      const res = await fetch('/api/admin/sectors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: key, isLive }),
      });
      const json = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) throw new Error(json.message || 'Update failed');
      setItems((prev) => prev.map((s) => (s.slug.trim().toLowerCase() === key ? { ...s, isLive } : s)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setUpdatingSlug(null);
    }
  }

  if (loading) {
    return (
      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.07)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/25 p-5">
        <p className="text-sm text-slate-500">Loading sector status…</p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.07)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/25">
      <div className="flex items-center gap-2 border-b border-slate-100/95 bg-gradient-to-r from-slate-50/98 to-white p-5 dark:border-slate-800 dark:from-slate-800/45 dark:to-slate-900/85">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900/90 text-white dark:bg-slate-700">
          <ToggleLeft size={18} aria-hidden />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Sector visibility</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Only the 12 public group sectors are listed (matches the website). When OFF, “Coming soon” in the
            mega-menu; when ON, the sector link works.
          </p>
        </div>
      </div>

      {error ? <p className="px-5 pt-3 text-sm text-red-600">{error}</p> : null}

      <ul className="divide-y divide-slate-100">
        {items.map((s) => (
          <li key={s.slug.trim().toLowerCase()} className="flex items-start justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="font-medium text-slate-900 dark:text-slate-100">{s.name}</p>
              <p className="mt-0.5 font-mono text-xs text-slate-500 dark:text-slate-400">{s.slug}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={s.isLive}
              disabled={updatingSlug === s.slug.trim().toLowerCase()}
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

