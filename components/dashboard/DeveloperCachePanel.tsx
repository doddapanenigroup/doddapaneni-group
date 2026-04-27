'use client';

import { useState } from 'react';
import { Trash2, RefreshCw } from 'lucide-react';
import { routing } from '@/i18n/routing';
import {
  dashboardHeaderActionPrimary,
  dashboardInputClass,
  dashboardNestedCardClass,
  dashboardPanelClass,
  dashboardPanelHeaderClass,
} from '@/lib/dashboard-ui';

export default function DeveloperCachePanel() {
  const [pathsText, setPathsText] = useState('/en\n/en/news\n/en/about');
  const [tagsText, setTagsText] = useState('');
  const [pathScope, setPathScope] = useState<'page' | 'layout'>('page');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; results?: unknown; message?: string } | null>(null);

  async function run() {
    setLoading(true);
    setResult(null);
    try {
      const paths = pathsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 50);
      const tags = tagsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 50);

      const res = await fetch('/api/developer/cache/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths, tags, pathScope }),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; results?: unknown; message?: string } | null;
      setResult(res.ok ? { ok: true, results: json?.results } : { ok: false, message: json?.message ?? `HTTP ${res.status}` });
      if (res.ok) {
        const devPath = `/${routing.defaultLocale}/dashboard/developer`;
        void fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            type: 'user_action',
            title: 'Cache revalidation completed',
            message: 'On-demand ISR revalidation finished',
            body: `Paths: ${paths.length}, tags: ${tags.length}, scope: ${pathScope}`,
            linkHref: devPath,
          }),
        }).catch(() => {});
      }
    } catch (e) {
      setResult({ ok: false, message: e instanceof Error ? e.message : 'Request failed' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={dashboardPanelClass}>
      <h2 className={`flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100 ${dashboardPanelHeaderClass}`}>
        <Trash2 size={20} className="text-slate-600" />
        Cache control (manual revalidation)
      </h2>

      <div className="p-5 space-y-3">
        <p className="text-sm text-slate-600">
          On-demand ISR: revalidate <strong>page</strong> (this route) or <strong>layout</strong> (this segment and below). Does
          not purge external CDNs.
        </p>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-slate-700">Path revalidation scope:</span>
          <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="pathScope"
              checked={pathScope === 'page'}
              onChange={() => setPathScope('page')}
            />
            Page
          </label>
          <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="pathScope"
              checked={pathScope === 'layout'}
              onChange={() => setPathScope('layout')}
            />
            Layout
          </label>
        </div>

        <div className="grid lg:grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-medium text-slate-700 mb-1">Paths (one per line)</p>
            <textarea
              value={pathsText}
              onChange={(e) => setPathsText(e.target.value)}
              rows={6}
              className={`w-full font-mono ${dashboardInputClass}`}
              placeholder="/en&#10;/en/news"
            />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-700 mb-1">Tags (optional, one per line)</p>
            <textarea
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              rows={6}
              className={`w-full font-mono ${dashboardInputClass}`}
              placeholder="content&#10;blog"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => run()}
            disabled={loading}
            className={`inline-flex items-center justify-center gap-2 disabled:opacity-50 ${dashboardHeaderActionPrimary}`}
          >
            <RefreshCw size={16} />
            {loading ? 'Revalidating…' : 'Clear cache'}
          </button>
          {result ? (
            <span
              className={`text-xs px-2 py-1 rounded border ${
                result.ok ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
              }`}
            >
              {result.ok ? 'Revalidation triggered' : `Failed: ${result.message ?? 'Unknown error'}`}
            </span>
          ) : null}
        </div>

        {result?.ok && result.results ? (
          <details className={`p-3 ${dashboardNestedCardClass}`}>
            <summary className="cursor-pointer text-sm text-slate-700">View results</summary>
            <pre className="mt-2 text-[11px] text-slate-700 whitespace-pre-wrap break-words">
              {JSON.stringify(result.results, null, 2)}
            </pre>
          </details>
        ) : null}
      </div>
    </section>
  );
}

