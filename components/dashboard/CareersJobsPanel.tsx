'use client';

import { useCallback, useEffect, useState } from 'react';
import { Briefcase, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { routing } from '@/i18n/routing';
import { publicPathWithLocale } from '@/lib/public-path-with-locale';

type TranslationRow = {
  locale: string;
  title: string;
  subtitle: string;
  description: string;
  applyLabel: string;
  applyUrl: string;
};

type JobRow = {
  id: string;
  slug: string;
  sortOrder: number;
  status: 'draft' | 'published';
  updatedAt: string;
  translations: TranslationRow[];
};

const LOCALES = routing.locales as readonly string[];

function emptyTranslation(locale: string): TranslationRow {
  return {
    locale,
    title: '',
    subtitle: '',
    description: '',
    applyLabel: 'Apply',
    applyUrl: '',
  };
}

function defaultMailtoApply(title: string): string {
  const sub = encodeURIComponent(`Application: ${title || 'Careers'}`);
  return `mailto:doddapanenigroup@yahoo.com?subject=${sub}`;
}

export default function CareersJobsPanel({ locale }: { locale: string }) {
  const [items, setItems] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editLocale, setEditLocale] = useState<string>('en');
  const [form, setForm] = useState<{
    slug: string;
    sortOrder: number;
    status: 'draft' | 'published';
    translations: TranslationRow[];
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/careers/jobs');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Failed to load');
      setItems((data.items ?? []) as JobRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function startNew() {
    setSelectedId('new');
    setEditLocale('en');
    setForm({
      slug: '',
      sortOrder: items.length,
      status: 'published',
      translations: LOCALES.map((loc) => emptyTranslation(loc)),
    });
  }

  function startEdit(job: JobRow) {
    setSelectedId(job.id);
    setEditLocale('en');
    const byLoc = new Map(job.translations.map((t) => [t.locale, t]));
    setForm({
      slug: job.slug,
      sortOrder: job.sortOrder,
      status: job.status,
      translations: LOCALES.map((loc) => {
        const existing = byLoc.get(loc);
        return existing
          ? { ...existing }
          : { ...emptyTranslation(loc), applyUrl: defaultMailtoApply(byLoc.get('en')?.title ?? '') };
      }),
    });
  }

  function updateTranslation(patch: Partial<TranslationRow>) {
    setForm((prev) => {
      if (!prev) return prev;
      const next = prev.translations.map((t) =>
        t.locale === editLocale ? { ...t, ...patch } : t,
      );
      return { ...prev, translations: next };
    });
  }

  function copyFromEn() {
    setForm((prev) => {
      if (!prev) return prev;
      const en = prev.translations.find((t) => t.locale === 'en');
      if (!en) return prev;
      return {
        ...prev,
        translations: prev.translations.map((t) =>
          t.locale === editLocale ? { ...t, ...en, locale: editLocale } : t,
        ),
      };
    });
  }

  async function save() {
    if (!form) return;
    const en = form.translations.find((t) => t.locale === 'en');
    if (!en?.title?.trim() || !en.subtitle?.trim() || !en.description?.trim() || !en.applyUrl?.trim()) {
      setError('English fields need title, subtitle, description, and apply URL.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        slug: form.slug.trim() || undefined,
        sortOrder: form.sortOrder,
        status: form.status,
        translations: form.translations.filter(
          (t) =>
            t.title.trim() &&
            t.subtitle.trim() &&
            t.description.trim() &&
            t.applyUrl.trim(),
        ),
      };

      if (selectedId === 'new') {
        const res = await fetch('/api/careers/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message ?? 'Create failed');
        const item = data.item as JobRow;
        setItems((prev) => [...prev, item].sort((a, b) => a.sortOrder - b.sortOrder));
        setSelectedId(item.id);
        startEdit(item);
      } else if (selectedId) {
        const res = await fetch(`/api/careers/jobs/${encodeURIComponent(selectedId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message ?? 'Save failed');
        const item = data.item as JobRow;
        setItems((prev) => {
          const rest = prev.filter((p) => p.id !== item.id);
          return [...rest, item].sort((a, b) => a.sortOrder - b.sortOrder);
        });
        startEdit(item);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this job listing?')) return;
    setError(null);
    try {
      const res = await fetch(`/api/careers/jobs/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message ?? 'Delete failed');
      }
      setItems((prev) => prev.filter((p) => p.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
        setForm(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    }
  }

  const currentTr = form?.translations.find((t) => t.locale === editLocale);

  return (
    <section
      id="careers-jobs-admin"
      className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.07)] dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/25"
    >
      <div className="flex flex-col gap-3 border-b border-slate-100/95 bg-gradient-to-r from-slate-50/98 to-white p-5 dark:border-slate-800 dark:from-slate-800/45 dark:to-slate-900/85 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
          <Briefcase size={22} className="text-blue-600 dark:text-blue-400" />
          Careers — job listings
        </h2>
        <div className="flex flex-wrap gap-2">
          <a
            href={publicPathWithLocale(locale, 'careers')}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            View public page
          </a>
          <button
            type="button"
            onClick={() => startNew()}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            New role
          </button>
        </div>
      </div>

      <div className="grid gap-6 p-5 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Published roles</p>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Loader2 className="animate-spin" size={18} />
              Loading…
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-slate-600">No roles yet. Add one or run database seed.</p>
          ) : (
            <ul className="space-y-2">
              {items.map((job) => {
                const enTitle = job.translations.find((t) => t.locale === 'en')?.title ?? job.slug;
                return (
                  <li
                    key={job.id}
                    className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm ${
                      selectedId === job.id
                        ? 'border-blue-400 bg-blue-50/80 dark:border-blue-500 dark:bg-slate-800'
                        : 'border-slate-200 dark:border-slate-600'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => startEdit(job)}
                      className="min-w-0 flex-1 text-left font-medium text-slate-800 dark:text-slate-100"
                    >
                      <span className="block truncate">{enTitle}</span>
                      <span className="text-xs font-normal text-slate-500">
                        {job.status} · order {job.sortOrder}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(job.id)}
                      className="shrink-0 rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                      aria-label="Delete job"
                    >
                      <Trash2 size={18} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 dark:border-slate-600 dark:bg-slate-800/40">
          {!form ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Select a role or create a new one. Add copy in each language you support; visitors see the best match for
              their locale, falling back to English.
            </p>
          ) : (
            <div className="space-y-4">
              {error ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-200">
                  {error}
                </p>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  URL slug
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="full-stack-developer"
                  />
                </label>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Sort order
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm({ ...form, sortOrder: Number(e.target.value) || 0 })
                    }
                  />
                </label>
              </div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                Status
                <select
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value === 'draft' ? 'draft' : 'published' })
                  }
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </label>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Language</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {LOCALES.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setEditLocale(loc)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase ${
                        editLocale === loc
                          ? 'bg-slate-900 text-white dark:bg-blue-600'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
                {editLocale !== 'en' ? (
                  <button
                    type="button"
                    onClick={copyFromEn}
                    className="mt-2 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Copy from English (then edit)
                  </button>
                ) : null}
              </div>

              {currentTr ? (
                <div className="space-y-3">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Title
                    <input
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
                      value={currentTr.title}
                      onChange={(e) => updateTranslation({ title: e.target.value })}
                    />
                  </label>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Subtitle (e.g. location · employment type)
                    <input
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
                      value={currentTr.subtitle}
                      onChange={(e) => updateTranslation({ subtitle: e.target.value })}
                    />
                  </label>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Description
                    <textarea
                      rows={5}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
                      value={currentTr.description}
                      onChange={(e) => updateTranslation({ description: e.target.value })}
                    />
                  </label>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Apply button label
                    <input
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
                      value={currentTr.applyLabel}
                      onChange={(e) => updateTranslation({ applyLabel: e.target.value })}
                    />
                  </label>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Apply URL (mailto:… or https://…)
                    <input
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
                      value={currentTr.applyUrl}
                      onChange={(e) => updateTranslation({ applyUrl: e.target.value })}
                      placeholder={defaultMailtoApply(currentTr.title)}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      updateTranslation({ applyUrl: defaultMailtoApply(currentTr.title) })
                    }
                    className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Reset apply URL to mailto template
                  </button>
                </div>
              ) : null}

              <button
                type="button"
                disabled={saving}
                onClick={() => void save()}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {selectedId === 'new' ? 'Create role' : 'Save changes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
