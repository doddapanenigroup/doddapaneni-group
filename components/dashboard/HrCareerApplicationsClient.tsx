'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Download, Loader2, RefreshCw } from 'lucide-react';

export type CareerApplicationListItem = {
  id: string;
  email: string;
  fullName: string | null;
  jobSlug: string | null;
  jobTitle: string | null;
  positionApplied: string | null;
  resumeFileName: string | null;
  resumeDataPresent: boolean;
  createdAt: string;
  details: Record<string, unknown>;
};

function formatKey(k: string): string {
  return k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
}

function isRenderable(v: unknown): v is string | number | boolean {
  return (
    typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
  );
}

export default function HrCareerApplicationsClient() {
  const [items, setItems] = useState<CareerApplicationListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/career-applications', { method: 'GET' });
      const json = (await res.json().catch(() => ({}))) as {
        items?: CareerApplicationListItem[];
        message?: string;
      };
      if (!res.ok) {
        setError(json.message || 'Could not load applications');
        setItems([]);
        return;
      }
      setItems(Array.isArray(json.items) ? json.items : []);
    } catch {
      setError('Network error while loading applications');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function toggleRow(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Applications with stored resumes can be downloaded here. Older rows may have details only
          (no file in the database).
        </p>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          Refresh
        </button>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-200">
          {error}
        </p>
      ) : null}

      {loading && items.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : null}

      {!loading && items.length === 0 && !error ? (
        <p className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
          No applications yet. Submissions from the public careers form will show up here.
        </p>
      ) : null}

      {items.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700/80 dark:bg-slate-900/40">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-800/60">
                  <th className="w-8 px-3 py-3" aria-hidden />
                  <th className="px-3 py-3 font-semibold text-slate-800 dark:text-slate-100">
                    Date
                  </th>
                  <th className="px-3 py-3 font-semibold text-slate-800 dark:text-slate-100">Name</th>
                  <th className="px-3 py-3 font-semibold text-slate-800 dark:text-slate-100">Email</th>
                  <th className="px-3 py-3 font-semibold text-slate-800 dark:text-slate-100">Role / job</th>
                  <th className="px-3 py-3 font-semibold text-slate-800 dark:text-slate-100">Resume</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => {
                  const isOpen = expanded.has(row.id);
                  const entries = Object.entries(row.details).filter(
                    ([k]) => k !== 'resumeFileName' && k !== 'resumeSize',
                  );
                  return (
                    <Fragment key={row.id}>
                      <tr className="border-b border-slate-100 dark:border-slate-800">
                        <td className="px-3 py-2 align-top">
                          <button
                            type="button"
                            onClick={() => toggleRow(row.id)}
                            className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                            aria-expanded={isOpen}
                            title={isOpen ? 'Collapse' : 'Expand details'}
                          >
                            {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </button>
                        </td>
                        <td className="px-3 py-2 align-top text-slate-600 dark:text-slate-300">
                          {new Date(row.createdAt).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 align-top font-medium text-slate-900 dark:text-slate-100">
                          {row.fullName || '—'}
                        </td>
                        <td className="px-3 py-2 align-top text-slate-700 dark:text-slate-200">
                          {row.email}
                        </td>
                        <td className="max-w-[220px] px-3 py-2 align-top text-slate-700 dark:text-slate-200">
                          <div className="line-clamp-2 font-medium">{row.jobTitle || row.jobSlug || '—'}</div>
                          {row.positionApplied ? (
                            <div className="line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                              {row.positionApplied}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 align-top">
                          {row.resumeDataPresent ? (
                            <a
                              href={`/api/career-applications/${row.id}/resume`}
                              className="inline-flex items-center gap-1.5 text-blue-600 hover:underline dark:text-blue-400"
                              download
                            >
                              <Download size={16} />
                              {row.resumeFileName || 'Download'}
                            </a>
                          ) : (
                            <span className="text-xs text-amber-700 dark:text-amber-300/90">
                              Not stored in database
                            </span>
                          )}
                        </td>
                      </tr>
                      {isOpen ? (
                        <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/20">
                          <td colSpan={6} className="px-4 py-3">
                            <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                              Full form fields
                            </p>
                            <dl className="grid max-h-[min(60vh,420px)] grid-cols-1 gap-3 overflow-y-auto sm:grid-cols-2">
                              {entries.map(([k, v]) => (
                                <div key={k} className="min-w-0">
                                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    {formatKey(k)}
                                  </dt>
                                  <dd className="whitespace-pre-wrap break-words text-slate-800 dark:text-slate-200">
                                    {v == null
                                      ? '—'
                                      : Array.isArray(v)
                                        ? (v as unknown[]).map(String).join(', ')
                                        : isRenderable(v)
                                          ? String(v)
                                          : JSON.stringify(v)}
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
