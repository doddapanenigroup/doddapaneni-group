'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Building2, ImagePlus, PlusCircle, Save, Trash2, X } from 'lucide-react';
import { COMPANY_DIVISION_SLUGS, pickCanonicalSectorRows } from '@/lib/company-divisions';

type SectorRow = { id: string; name: string; slug: string; isLive: boolean };

type CompanyRow = {
  id: string;
  name: string;
  slug: string;
  logoImage: string | null;
  description: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  xUrl: string | null;
  youtubeUrl: string | null;
  pinterestUrl: string | null;
  sector: { id: string; name: string; slug: string } | null;
};

type FormState = {
  name: string;
  slug: string;
  sectorSlug: string;
  logoImage: string;
  description: string;
  facebookUrl: string;
  instagramUrl: string;
  xUrl: string;
  youtubeUrl: string;
  pinterestUrl: string;
};

/** Group flagship slugs — should exist in DB for sector pages + admin list; `sync-flagships` upserts them. */
const FLAGSHIP_SLUGS = ['dlsin', 'dealsmedi', 'janatha-mirror'] as const;

const EMPTY_FORM: FormState = {
  name: '',
  slug: '',
  sectorSlug: COMPANY_DIVISION_SLUGS[0],
  logoImage: '',
  description: '',
  facebookUrl: '',
  instagramUrl: '',
  xUrl: '',
  youtubeUrl: '',
  pinterestUrl: '',
};

export default function CompaniesAdminPanel() {
  const [sectors, setSectors] = useState<SectorRow[]>([]);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [logoUploading, setLogoUploading] = useState(false);
  const [syncingFlagships, setSyncingFlagships] = useState(false);
  const logoFileRef = useRef<HTMLInputElement>(null);

  const missingFlagshipSlugs = FLAGSHIP_SLUGS.filter(
    (slug) => !companies.some((c) => c.slug === slug),
  );

  const load = useCallback(async () => {
    setError(null);
    const [r1, r2] = await Promise.all([
      fetch('/api/admin/sectors', { cache: 'no-store' }),
      fetch('/api/admin/companies', { cache: 'no-store' }),
    ]);
    if (r1.status === 403 || r2.status === 403) {
      setError('Forbidden');
      setSectors([]);
      setCompanies([]);
      return;
    }
    if (!r1.ok || !r2.ok) {
      setError('Could not load companies.');
      return;
    }
    const d1 = (await r1.json()) as { sectors?: SectorRow[] };
    const d2 = (await r2.json()) as { companies?: CompanyRow[] };
    const sectorRows = pickCanonicalSectorRows(d1.sectors ?? []);
    setSectors(sectorRows);
    setCompanies(d2.companies ?? []);
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

  async function uploadCompanyLogo(file: File) {
    setError(null);
    if (file.type && !file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    setLogoUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/marketer/stored-image', { method: 'POST', body: fd });
      const json = (await res.json().catch(() => ({}))) as { url?: string; message?: string };
      if (!res.ok) throw new Error(json.message || 'Logo upload failed');
      if (!json.url) throw new Error('Upload did not return a URL');
      setForm((f) => ({ ...f, logoImage: json.url! }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Logo upload failed');
      if (logoFileRef.current) logoFileRef.current.value = '';
      setForm((f) => ({ ...f, logoImage: '' }));
    } finally {
      setLogoUploading(false);
    }
  }

  function clearCompanyLogo() {
    setForm((f) => ({ ...f, logoImage: '' }));
    if (logoFileRef.current) logoFileRef.current.value = '';
  }

  async function createCompany() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          sectorSlug: form.sectorSlug,
          logoImage: form.logoImage || null,
          description: form.description || null,
          facebookUrl: form.facebookUrl || null,
          instagramUrl: form.instagramUrl || null,
          xUrl: form.xUrl || null,
          youtubeUrl: form.youtubeUrl || null,
          pinterestUrl: form.pinterestUrl || null,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as any;
      if (!res.ok) throw new Error(json.message || 'Create failed');
      setForm(EMPTY_FORM);
      if (logoFileRef.current) logoFileRef.current.value = '';
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create failed');
    } finally {
      setSaving(false);
    }
  }

  async function syncFlagshipCompanies() {
    setSyncingFlagships(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/companies/sync-flagships', { method: 'POST' });
      const json = (await res.json().catch(() => ({}))) as {
        message?: string;
        skipped?: string[];
        upserted?: string[];
      };
      if (!res.ok) throw new Error(json.message || 'Sync failed');
      if (json.skipped?.length) {
        setError(
          `Some companies were skipped (sector missing in DB): ${json.skipped.join(', ')}. Run a full db:seed first.`,
        );
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sync failed');
    } finally {
      setSyncingFlagships(false);
    }
  }

  async function deleteCompany(id: string) {
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/companies/${encodeURIComponent(id)}`, { method: 'DELETE' });
      const json = (await res.json().catch(() => ({}))) as any;
      if (!res.ok) throw new Error(json.message || 'Delete failed');
      setCompanies((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.07)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/25 p-5">
        <p className="text-sm text-slate-500">Loading companies…</p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.07)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/25">
      <div className="flex items-center gap-2 border-b border-slate-100/95 bg-gradient-to-r from-slate-50/98 to-white p-5 dark:border-slate-800 dark:from-slate-800/45 dark:to-slate-900/85">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900/90 text-white dark:bg-slate-700">
          <Building2 size={18} aria-hidden />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Companies</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Add companies and attach them to one of the 12 sectors.
          </p>
        </div>
      </div>

      {error ? <p className="px-5 pt-3 text-sm text-red-600">{error}</p> : null}

      <div className="p-5 border-b border-slate-100">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">Company name *</span>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="DealsMedi"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">Company slug *</span>
            <input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="dealsmedi"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">Sector *</span>
            <select
              value={form.sectorSlug}
              onChange={(e) => setForm((f) => ({ ...f, sectorSlug: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              {COMPANY_DIVISION_SLUGS.map((slug) => {
                const row = sectors.find((s) => s.slug.trim().toLowerCase() === slug);
                const label = row?.name ?? slug;
                const live = row?.isLive ?? false;
                return (
                  <option key={slug} value={slug}>
                    {label} — {live ? 'Live' : 'Coming soon'}
                  </option>
                );
              })}
            </select>
          </label>
          <div className="block md:col-span-2">
            <span className="text-xs font-semibold text-slate-700">Company logo</span>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Upload any image; it is converted to WebP, stored in the media library, and the public URL is saved on the company.
            </p>
            <div className="mt-2 flex flex-wrap items-start gap-3">
              <input
                ref={logoFileRef}
                type="file"
                accept="image/*"
                disabled={logoUploading}
                className="block w-full max-w-xs text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-800 hover:file:bg-slate-200 disabled:opacity-50"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadCompanyLogo(file);
                }}
              />
              {form.logoImage ? (
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.logoImage}
                    alt="Logo preview"
                    className="h-14 w-14 shrink-0 rounded-lg border border-slate-200 bg-white object-contain"
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] font-mono text-slate-600 break-all">{form.logoImage}</p>
                    <button
                      type="button"
                      onClick={clearCompanyLogo}
                      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      <X size={14} aria-hidden />
                      Remove logo
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
            {logoUploading ? (
              <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <ImagePlus size={14} className="animate-pulse" aria-hidden />
                Converting to WebP and saving to media…
              </p>
            ) : null}
          </div>
        </div>

        <label className="mt-4 block">
          <span className="text-xs font-semibold text-slate-700">Description</span>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="mt-1 min-h-28 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Short summary shown on sector page."
          />
        </label>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">Facebook</span>
            <input
              value={form.facebookUrl}
              onChange={(e) => setForm((f) => ({ ...f, facebookUrl: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="https://facebook.com/…"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">Instagram</span>
            <input
              value={form.instagramUrl}
              onChange={(e) => setForm((f) => ({ ...f, instagramUrl: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="https://instagram.com/…"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">X (Twitter)</span>
            <input
              value={form.xUrl}
              onChange={(e) => setForm((f) => ({ ...f, xUrl: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="https://x.com/…"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">YouTube</span>
            <input
              value={form.youtubeUrl}
              onChange={(e) => setForm((f) => ({ ...f, youtubeUrl: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="https://youtube.com/…"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">Pinterest</span>
            <input
              value={form.pinterestUrl}
              onChange={(e) => setForm((f) => ({ ...f, pinterestUrl: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="https://pinterest.com/…"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={createCompany}
            disabled={saving || !form.name.trim() || !form.slug.trim() || !form.sectorSlug.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? <Save size={16} /> : <PlusCircle size={16} />}
            Add company
          </button>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Existing companies</h3>
          {missingFlagshipSlugs.length > 0 ? (
            <button
              type="button"
              onClick={() => void syncFlagshipCompanies()}
              disabled={syncingFlagships}
              className="inline-flex shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-900 hover:bg-blue-100 disabled:opacity-50 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-100 dark:hover:bg-blue-900/40"
            >
              {syncingFlagships
                ? 'Syncing…'
                : `Add flagship companies (${missingFlagshipSlugs.join(', ')})`}
            </button>
          ) : null}
        </div>
        {missingFlagshipSlugs.length > 0 ? (
          <p className="mb-3 text-xs text-slate-600 dark:text-slate-400">
            DealsMedi and Janatha Mirror (and Dlsin if missing) are defined in the project seed. Use the button
            above to create or update them in the database so they appear here and on sector pages.
          </p>
        ) : null}
        {companies.length === 0 ? (
          <p className="text-sm text-slate-500">No companies yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden bg-white">
            {companies.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-4 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  {c.logoImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.logoImage}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg border border-slate-200 bg-white object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-[10px] text-slate-400">
                      No logo
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{c.slug}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Sector: {c.sector?.name ?? '—'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => deleteCompany(c.id)}
                  disabled={deletingId === c.id}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

