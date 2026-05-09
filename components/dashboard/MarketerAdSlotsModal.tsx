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

export type MarketingAdSlotRow = {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  recommendedWidth: number | null;
  recommendedHeight: number | null;
  diagramRegion: string | null;
  sortOrder: number;
};

type SlotForm = {
  slug: string;
  label: string;
  description: string;
  recommendedWidth: string;
  recommendedHeight: string;
  diagramRegion: string;
  sortOrder: string;
};

const emptyForm = (): SlotForm => ({
  slug: '',
  label: '',
  description: '',
  recommendedWidth: '',
  recommendedHeight: '',
  diagramRegion: '',
  sortOrder: '',
});

const DIAGRAM_OPTIONS = [
  { value: '', label: '— Region —' },
  { value: 'header_top', label: 'Header top' },
  { value: 'article_body', label: 'Article body' },
  { value: 'sidebar', label: 'Sidebar' },
  { value: 'below_fold', label: 'Below fold' },
  { value: 'other', label: 'Other' },
];

export default function MarketerAdSlotsModal({
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
  const [items, setItems] = useState<MarketingAdSlotRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<SlotForm>(emptyForm);
  const [editForm, setEditForm] = useState<SlotForm>(emptyForm);

  const fieldClass = dashboardInputClass;

  useEffect(() => {
    setDomReady(true);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/marketer/ad-slots', { credentials: 'include' });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = payload as { message?: unknown; detail?: unknown };
        const parts = [
          typeof err.message === 'string' ? err.message : null,
          typeof err.detail === 'string' ? err.detail : null,
        ].filter(Boolean);
        setError(
          parts.length > 0 ? parts.join(' — ') : `Could not load ad slots (${res.status}).`,
        );
        setItems([]);
        return;
      }
      const d = payload as { items?: unknown };
      setItems((Array.isArray(d.items) ? d.items : []) as MarketingAdSlotRow[]);
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
    setCreateForm(emptyForm());
    setEditForm(emptyForm());
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  function rowToForm(row: MarketingAdSlotRow): SlotForm {
    return {
      slug: row.slug,
      label: row.label,
      description: row.description ?? '',
      recommendedWidth: row.recommendedWidth != null ? String(row.recommendedWidth) : '',
      recommendedHeight: row.recommendedHeight != null ? String(row.recommendedHeight) : '',
      diagramRegion: row.diagramRegion ?? '',
      sortOrder: String(row.sortOrder),
    };
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/marketer/ad-slots', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: createForm.slug,
          label: createForm.label,
          description: createForm.description || null,
          diagramRegion: createForm.diagramRegion || null,
          recommendedWidth: createForm.recommendedWidth.trim()
            ? parseInt(createForm.recommendedWidth, 10)
            : null,
          recommendedHeight: createForm.recommendedHeight.trim()
            ? parseInt(createForm.recommendedHeight, 10)
            : null,
          sortOrder: createForm.sortOrder.trim() ? parseInt(createForm.sortOrder, 10) : undefined,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof d.message === 'string' ? d.message : 'Save failed.');
        return;
      }
      await load();
      onSaved?.();
      setCreateForm(emptyForm());
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(row: MarketingAdSlotRow) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/marketer/ad-slots/${encodeURIComponent(row.id)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: editForm.slug,
          label: editForm.label,
          description: editForm.description || null,
          diagramRegion: editForm.diagramRegion || null,
          recommendedWidth: editForm.recommendedWidth.trim() ? parseInt(editForm.recommendedWidth, 10) : null,
          recommendedHeight: editForm.recommendedHeight.trim()
            ? parseInt(editForm.recommendedHeight, 10)
            : null,
          sortOrder: editForm.sortOrder.trim() ? parseInt(editForm.sortOrder, 10) : row.sortOrder,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof d.message === 'string' ? d.message : 'Update failed.');
        return;
      }
      setEditingId(null);
      setEditForm(emptyForm());
      await load();
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  async function removeRow(id: string) {
    if (!confirm('Delete this ad slot definition?')) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/marketer/ad-slots/${encodeURIComponent(id)}`, {
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

  function startEdit(row: MarketingAdSlotRow) {
    setEditingId(row.id);
    setEditForm(rowToForm(row));
  }

  const modal =
    open ? (
      <div
        className="fixed inset-0 z-[10001] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ad-slots-modal-title"
      >
        <button
          type="button"
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]"
          aria-label="Close"
          onClick={onClose}
        />
        <div className="relative flex max-h-[min(90dvh,720px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-950">
          <header className={`flex shrink-0 items-center justify-between gap-3 px-4 py-3 sm:px-5 ${dashboardPanelHeaderClass}`}>
            <div>
              <h2 id="ad-slots-modal-title" className="text-base font-semibold text-slate-900 dark:text-white">
                Manage ad slots
              </h2>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                Reference placements and recommended sizes for the blog editor sidebar.
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
                <div className={`${dashboardNestedCardClass}`}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Placement map</p>
                  <div className="space-y-1 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-[10px] text-slate-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-400">
                    <div className="rounded border border-slate-200 px-2 py-1 text-center dark:border-slate-600">Header top</div>
                    <div className="rounded border border-slate-200 px-2 py-3 text-center dark:border-slate-600">Article body</div>
                    <div className="grid grid-cols-3 gap-1">
                      <div className="rounded border border-slate-200 py-2 text-center dark:border-slate-600">Sidebar</div>
                      <div className="col-span-2 rounded border border-slate-200 py-2 text-center dark:border-slate-600">
                        Below fold
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/90 dark:text-slate-400">
                      <tr>
                        <th className="px-3 py-2">Label</th>
                        <th className="px-3 py-2">Slug</th>
                        <th className="px-3 py-2">Region</th>
                        <th className="px-3 py-2">Size (W×H)</th>
                        <th className="px-3 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {items.map((row) =>
                        editingId === row.id ? (
                          <tr key={row.id} className="bg-violet-50/50 dark:bg-violet-950/20">
                            <td className="px-3 py-2 align-top" colSpan={5}>
                              <div className="grid gap-2 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                  <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">Label</label>
                                  <input
                                    className={fieldClass}
                                    value={editForm.label}
                                    onChange={(e) => setEditForm((f) => ({ ...f, label: e.target.value }))}
                                  />
                                </div>
                                <div>
                                  <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">Slug</label>
                                  <input
                                    className={fieldClass}
                                    value={editForm.slug}
                                    onChange={(e) => setEditForm((f) => ({ ...f, slug: e.target.value }))}
                                  />
                                </div>
                                <div>
                                  <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">Sort</label>
                                  <input
                                    className={fieldClass}
                                    value={editForm.sortOrder}
                                    onChange={(e) => setEditForm((f) => ({ ...f, sortOrder: e.target.value }))}
                                  />
                                </div>
                                <div>
                                  <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">Region</label>
                                  <select
                                    className={fieldClass}
                                    value={editForm.diagramRegion}
                                    onChange={(e) => setEditForm((f) => ({ ...f, diagramRegion: e.target.value }))}
                                  >
                                    {DIAGRAM_OPTIONS.map((o) => (
                                      <option key={o.value || 'none'} value={o.value}>
                                        {o.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex gap-2">
                                  <div className="flex-1">
                                    <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">W px</label>
                                    <input
                                      className={fieldClass}
                                      value={editForm.recommendedWidth}
                                      onChange={(e) => setEditForm((f) => ({ ...f, recommendedWidth: e.target.value }))}
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">H px</label>
                                    <input
                                      className={fieldClass}
                                      value={editForm.recommendedHeight}
                                      onChange={(e) => setEditForm((f) => ({ ...f, recommendedHeight: e.target.value }))}
                                    />
                                  </div>
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">
                                    Description
                                  </label>
                                  <textarea
                                    className={fieldClass}
                                    rows={2}
                                    value={editForm.description}
                                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                                  />
                                </div>
                                <div className="flex flex-wrap gap-2 sm:col-span-2">
                                  <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => void saveEdit(row)}
                                    className={`${dashboardHeaderActionSecondary} text-xs`}
                                  >
                                    Save row
                                  </button>
                                  <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => {
                                      setEditingId(null);
                                      setEditForm(emptyForm());
                                    }}
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
                            <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400">
                              {row.diagramRegion ?? '—'}
                            </td>
                            <td className="px-3 py-2 font-mono text-xs text-slate-600 dark:text-slate-400">
                              {row.recommendedWidth != null && row.recommendedHeight != null
                                ? `${row.recommendedWidth} × ${row.recommendedHeight}`
                                : '—'}
                            </td>
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
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Add slot</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">Label</label>
                      <input
                        className={fieldClass}
                        required
                        value={createForm.label}
                        onChange={(e) => setCreateForm((f) => ({ ...f, label: e.target.value }))}
                        placeholder="e.g. In-feed native"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">Slug</label>
                      <input
                        className={fieldClass}
                        required
                        disabled={editingId !== null}
                        value={createForm.slug}
                        onChange={(e) => setCreateForm((f) => ({ ...f, slug: e.target.value }))}
                        placeholder="in-feed-native"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">Region</label>
                      <select
                        className={fieldClass}
                        disabled={editingId !== null}
                        value={createForm.diagramRegion}
                        onChange={(e) => setCreateForm((f) => ({ ...f, diagramRegion: e.target.value }))}
                      >
                        {DIAGRAM_OPTIONS.map((o) => (
                          <option key={o.value || 'none'} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">W</label>
                        <input
                          className={fieldClass}
                          disabled={editingId !== null}
                          value={createForm.recommendedWidth}
                          onChange={(e) => setCreateForm((f) => ({ ...f, recommendedWidth: e.target.value }))}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">H</label>
                        <input
                          className={fieldClass}
                          disabled={editingId !== null}
                          value={createForm.recommendedHeight}
                          onChange={(e) => setCreateForm((f) => ({ ...f, recommendedHeight: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">Description</label>
                      <textarea
                        className={fieldClass}
                        rows={2}
                        disabled={editingId !== null}
                        value={createForm.description}
                        onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={saving || editingId !== null}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                    Add slot
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
