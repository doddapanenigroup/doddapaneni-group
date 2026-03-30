'use client';

import { useState } from 'react';
import { Trash2, RefreshCw } from 'lucide-react';

export default function DeveloperCachePanel() {
  const [pathsText, setPathsText] = useState('/en\n/en/news\n/en/about');
  const [tagsText, setTagsText] = useState('');
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
        body: JSON.stringify({ paths, tags }),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; results?: unknown; message?: string } | null;
      setResult(res.ok ? { ok: true, results: json?.results } : { ok: false, message: json?.message ?? `HTTP ${res.status}` });
    } catch (e) {
      setResult({ ok: false, message: e instanceof Error ? e.message : 'Request failed' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.07)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/25">
      <h2 className="text-lg font-semibold text-slate-800 p-5 border-b border-slate-100/95 bg-gradient-to-r from-slate-50/98 to-white dark:border-slate-800 dark:from-slate-800/45 dark:to-slate-900/85 flex items-center gap-2">
        <Trash2 size={20} className="text-slate-600" />
        Cache control (manual revalidation)
      </h2>

      <div className="p-5 space-y-3">
        <p className="text-sm text-slate-600">
          This triggers Next.js on-demand revalidation. It does not expose secrets and does not cause downtime.
        </p>

        <div className="grid lg:grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-medium text-slate-700 mb-1">Paths (one per line)</p>
            <textarea
              value={pathsText}
              onChange={(e) => setPathsText(e.target.value)}
              rows={6}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
              placeholder="/en&#10;/en/news"
            />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-700 mb-1">Tags (optional, one per line)</p>
            <textarea
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              rows={6}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
              placeholder="content&#10;blog"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => run()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-700 text-white px-4 py-2 text-sm hover:bg-slate-800 disabled:opacity-50"
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
          <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
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

