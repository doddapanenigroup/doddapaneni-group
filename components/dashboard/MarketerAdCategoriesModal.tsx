'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Plus, Pencil, Trash2, X } from 'lucide-react';
import {
  dashboardHeaderActionSecondary,
  dashboardIconButtonClass,
  dashboardInputClass,
  dashboardNestedCardClass,
  dashboardPanelHeaderClass,
} from '@/lib/dashboard-ui';

export type MarketingAdCategoryRow = {
  id: string;
  slug: string;
  label: string;
  sortOrder: number;
};

export default function MarketerAdCategoriesModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [domReady, setDomReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<MarketingAdCategoryRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createSlug, setCreateSlug] = useState('');
  const [createLabel, setCreateLabel] = useState('');
  const [createSort, setCreateSort] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [editSort, setEditSort] = useState('');

  const fieldClass = dashboardInputClass;

  useEffect(() => {
    setDomReady(true);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/marketer/ad-categories', { credentials: 'include' });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = payload as { message?: unknown; detail?: unknown };
        const parts = [
          typeof err.message === 'string' ? err.message : null,
          typeof err.detail === 'string' ? err.detail : null,
        ].filter(Boolean);
        setError(
          parts.length > 0 ? parts.join(' — ') : `Could not load categories (${res.status}).`,
        );
        setItems([]);
        return;
      }
      const d = payload as { items?: unknown };
      setItems((Array.isArray(d.items) ? d.items : []) as MarketingAdCategoryRow[]);
    } catch {
      setError('Network error.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void load();
    setEditingId(null);
    setCreateSlug('');
    setCreateLabel('');
    setCreateSort('');
    setEditSlug('');
    setEditLabel('');
    setEditSort('');
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/marketer/ad-categories', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: createSlug,
          label: createLabel,
          sortOrder: createSort.trim() ? parseInt(createSort, 10) : undefined,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof d.message === 'string' ? d.message : 'Save failed.');
        return;
      }
      await load();
      onSaved?.();
      setCreateSlug('');
      setCreateLabel('');
      setCreateSort('');
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(row: MarketingAdCategoryRow) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/marketer/ad-categories/${encodeURIComponent(row.id)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: editSlug,
          label: editLabel,
          sortOrder: editSort.trim() ? parseInt(editSort, 10) : row.sortOrder,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof d.message === 'string' ? d.message : 'Update failed.');
        return;
      }
      setEditingId(null);
      await load();
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  async function removeRow(id: string) {
    if (!confirm('Delete this category? Posts may still reference the slug in legacy fields.')) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/marketer/ad-categories/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(typeof d.message === 'string' ? d.message : 'Delete failed.');
        return;
      }
      await load();
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  function startEdit(row: MarketingAdCategoryRow) {
    setEditingId(row.id);
    setEditSlug(row.slug);
    setEditLabel(row.label);
    setEditSort(String(row.sortOrder));
  }

  const modal =
    open ? (
      <div
        className="fixed inset-0 z-[10001] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ad-categories-modal-title"
      >
        <button
          type="button"
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]"
          aria-label="Close"
          onClick={onClose}
        />
        <div className="relative flex max-h-[min(90dvh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-950">
          <header className={`flex shrink-0 items-center justify-between gap-3 px-4 py-3 sm:px-5 ${dashboardPanelHeaderClass}`}>
            <div>
              <h2 id="ad-categories-modal-title" className="text-base font-semibold text-slate-900 dark:text-white">
                Manage category ads
              </h2>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                Topic buckets used when targeting ads by category in the blog editor.
              </p>
            </div>
            <button type="button" onClick={onClose} className={dashboardIconButtonClass} aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            {error ? (
              <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100">
                {error}
              </p>
            ) : null}

            {loading ? (
              <div className="flex items-center gap-2 py-12 text-slate-500">
                <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
                Loading…
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/90 dark:text-slate-400">
                      <tr>
                        <th className="px-3 py-2">Label</th>
                        <th className="px-3 py-2">Slug</th>
                        <th className="px-3 py-2">Sort</th>
                        <th className="px-3 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {items.map((row) =>
                        editingId === row.id ? (
                          <tr key={row.id} className="bg-violet-50/50 dark:bg-violet-950/20">
                            <td className="px-3 py-2 align-top" colSpan={4}>
                              <div className="grid gap-2">
                                <div>
                                  <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">
                                    Label
                                  </label>
                                  <input
                                    className={fieldClass}
                                    value={editLabel}
                                    onChange={(e) => setEditLabel(e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">
                                    Slug
                                  </label>
                                  <input
                                    className={fieldClass}
                                    value={editSlug}
                                    onChange={(e) => setEditSlug(e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">
                                    Sort
                                  </label>
                                  <input
                                    className={fieldClass}
                                    value={editSort}
                                    onChange={(e) => setEditSort(e.target.value)}
                                  />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => void saveEdit(row)}
                                    className={`${dashboardHeaderActionSecondary} text-xs`}
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => setEditingId(null)}
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-600"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          <tr key={row.id} className="bg-white dark:bg-slate-900/40">
                            <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100">{row.label}</td>
                            <td className="px-3 py-2 font-mono text-xs text-slate-600 dark:text-slate-400">{row.slug}</td>
                            <td className="px-3 py-2 tabular-nums text-slate-600 dark:text-slate-400">{row.sortOrder}</td>
                            <td className="px-3 py-2 text-right">
                              <button
                                type="button"
                                className="mr-1 inline-flex rounded p-1 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                                onClick={() => startEdit(row)}
                                aria-label="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                className="inline-flex rounded p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                                onClick={() => void removeRow(row.id)}
                                aria-label="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>

                <form onSubmit={submitCreate} className={`space-y-3 ${dashboardNestedCardClass}`}>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Add category</p>
                  <div className="grid gap-2">
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">Label</label>
                      <input
                        className={fieldClass}
                        required
                        disabled={editingId !== null}
                        value={createLabel}
                        onChange={(e) => setCreateLabel(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">Slug</label>
                      <input
                        className={fieldClass}
                        required
                        disabled={editingId !== null}
                        value={createSlug}
                        onChange={(e) => setCreateSlug(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">
                        Sort (optional)
                      </label>
                      <input
                        className={fieldClass}
                        disabled={editingId !== null}
                        value={createSort}
                        onChange={(e) => setCreateSort(e.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={saving || editingId !== null}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                    Add category
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    ) : null;

  return domReady && modal ? createPortal(modal, document.body) : null;
}
