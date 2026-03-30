'use client';

import { useCallback, useEffect, useState } from 'react';
import { Flag } from 'lucide-react';

type Item = {
  name: string;
  label: string;
  description: string;
  enabled: boolean;
};

const FEATURE_FLAGS_CHANGED = 'feature-flags-changed';

export function broadcastFeatureFlagChanged(name: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(FEATURE_FLAGS_CHANGED, { detail: { name } }));
  }
}

export default function FeatureFlagsPanel() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch('/api/features', { cache: 'no-store' });
    if (res.status === 403) {
      setError('Only Super Admin can view feature flags.');
      setItems([]);
      return;
    }
    if (!res.ok) {
      setError('Could not load feature flags.');
      return;
    }
    const data = (await res.json()) as { items?: Item[] };
    setItems(data.items ?? []);
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

  async function toggle(name: string, enabled: boolean) {
    setUpdating(name);
    setError(null);
    try {
      const res = await fetch(`/api/features/${encodeURIComponent(name)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      const json = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) throw new Error(json.message || 'Update failed');
      setItems((prev) => prev.map((i) => (i.name === name ? { ...i, enabled } : i)));
      broadcastFeatureFlagChanged(name);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setUpdating(null);
    }
  }

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.07)] dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/25">
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading feature flags…</p>
      </section>
    );
  }

  if (error && items.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.07)] dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/25">
        <p className="text-sm text-red-600">{error}</p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.07)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/25">
      <div className="flex items-center gap-3 border-b border-slate-100/95 bg-gradient-to-r from-slate-50/98 to-white p-5 dark:border-slate-800 dark:from-slate-800/45 dark:to-slate-900/85">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/90 text-white dark:bg-amber-600/90">
          <Flag size={18} aria-hidden />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Feature flags</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Toggle platform features. Changes apply on the next request (cached ~30s on server for some checks).
          </p>
        </div>
      </div>

      {error ? <p className="px-5 pt-3 text-sm text-red-600">{error}</p> : null}

      <ul className="divide-y divide-slate-100 dark:divide-slate-800/80">
        {items.map((item) => (
          <li key={item.name} className="flex items-start justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="font-medium text-slate-900 dark:text-slate-100">{item.label}</p>
              <p className="mt-0.5 font-mono text-xs text-slate-500 dark:text-slate-400">{item.name}</p>
              {item.description ? (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={item.enabled}
              disabled={updating === item.name}
              onClick={() => toggle(item.name, !item.enabled)}
              className={`relative h-8 w-14 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50 ${
                item.enabled ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                  item.enabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
              <span className="sr-only">{item.enabled ? 'Disable' : 'Enable'} {item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
