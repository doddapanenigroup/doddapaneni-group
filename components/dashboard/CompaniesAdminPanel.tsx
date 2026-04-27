'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Building2, ImagePlus, Pencil, PlusCircle, Save, Trash2, X } from 'lucide-react';
import { COMPANY_DIVISION_SLUGS, pickCanonicalSectorRows } from '@/lib/company-divisions';
import {
  dashboardHeaderActionSecondary,
  dashboardInputClass,
  dashboardListFrameClass,
  dashboardNestedCardClass,
  dashboardPanelClass,
  dashboardPanelHeaderClass,
} from '@/lib/dashboard-ui';

type SectorRow = { id: string; name: string; slug: string; isLive: boolean };

type CompanyRow = {
  id: string;
  name: string;
  slug: string;
  logoImage: string | null;
  heroImage: string | null;
  websiteUrl: string | null;
  description: string | null;
  aboutContent: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  xUrl: string | null;
  youtubeUrl: string | null;
  pinterestUrl: string | null;
  linkedinUrl: string | null;
  sector: { id: string; name: string; slug: string } | null;
};

type FormState = {
  name: string;
  slug: string;
  sectorSlug: string;
  logoImage: string;
  heroImage: string;
  websiteUrl: string;
  description: string;
  aboutContent: string;
  facebookUrl: string;
  instagramUrl: string;
  xUrl: string;
  youtubeUrl: string;
  pinterestUrl: string;
  linkedinUrl: string;
};

type ApiMessage = { message?: string };

const EMPTY_FORM: FormState = {
  name: '',
  slug: '',
  sectorSlug: COMPANY_DIVISION_SLUGS[0],
  logoImage: '',
  heroImage: '',
  websiteUrl: '',
  description: '',
  aboutContent: '',
  facebookUrl: '',
  instagramUrl: '',
  xUrl: '',
  youtubeUrl: '',
  pinterestUrl: '',
  linkedinUrl: '',
};

export default function CompaniesAdminPanel() {
  const [sectors, setSectors] = useState<SectorRow[]>([]);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editCompanyId, setEditCompanyId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);
  const [logoUploading, setLogoUploading] = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);
  const logoFileRef = useRef<HTMLInputElement>(null);
  const heroFileRef = useRef<HTMLInputElement>(null);

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

  async function uploadCompanyHeroImage(file: File) {
    setError(null);
    if (file.type && !file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    setHeroUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/marketer/stored-image', { method: 'POST', body: fd });
      const json = (await res.json().catch(() => ({}))) as { url?: string; message?: string };
      if (!res.ok) throw new Error(json.message || 'Image upload failed');
      if (!json.url) throw new Error('Upload did not return a URL');
      setForm((f) => ({ ...f, heroImage: json.url! }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Image upload failed');
      if (heroFileRef.current) heroFileRef.current.value = '';
      setForm((f) => ({ ...f, heroImage: '' }));
    } finally {
      setHeroUploading(false);
    }
  }

  function clearCompanyLogo() {
    setForm((f) => ({ ...f, logoImage: '' }));
    if (logoFileRef.current) logoFileRef.current.value = '';
  }

  function clearCompanyHeroImage() {
    setForm((f) => ({ ...f, heroImage: '' }));
    if (heroFileRef.current) heroFileRef.current.value = '';
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
          heroImage: form.heroImage || null,
          websiteUrl: form.websiteUrl || null,
          description: form.description || null,
          aboutContent: form.aboutContent || null,
          facebookUrl: form.facebookUrl || null,
          instagramUrl: form.instagramUrl || null,
          xUrl: form.xUrl || null,
          youtubeUrl: form.youtubeUrl || null,
          pinterestUrl: form.pinterestUrl || null,
          linkedinUrl: form.linkedinUrl || null,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as ApiMessage;
      if (!res.ok) throw new Error(json.message || 'Create failed');
      setForm(EMPTY_FORM);
      if (logoFileRef.current) logoFileRef.current.value = '';
      if (heroFileRef.current) heroFileRef.current.value = '';
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create failed');
    } finally {
      setSaving(false);
    }
  }

  async function deleteCompany(id: string) {
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/companies/${encodeURIComponent(id)}`, { method: 'DELETE' });
      const json = (await res.json().catch(() => ({}))) as ApiMessage;
      if (!res.ok) throw new Error(json.message || 'Delete failed');
      setCompanies((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  }

  function editStateFromCompany(c: CompanyRow): FormState {
    return {
      name: c.name ?? '',
      slug: c.slug ?? '',
      sectorSlug: c.sector?.slug ?? COMPANY_DIVISION_SLUGS[0],
      logoImage: c.logoImage ?? '',
      heroImage: c.heroImage ?? '',
      websiteUrl: c.websiteUrl ?? '',
      description: c.description ?? '',
      aboutContent: c.aboutContent ?? '',
      facebookUrl: c.facebookUrl ?? '',
      instagramUrl: c.instagramUrl ?? '',
      xUrl: c.xUrl ?? '',
      youtubeUrl: c.youtubeUrl ?? '',
      pinterestUrl: c.pinterestUrl ?? '',
      linkedinUrl: c.linkedinUrl ?? '',
    };
  }

  function startEditCompany(c: CompanyRow) {
    setError(null);
    setEditCompanyId(c.id);
    setEditForm(editStateFromCompany(c));
  }

  function cancelEditCompany() {
    setEditCompanyId(null);
    setEditForm(EMPTY_FORM);
  }

  async function saveEditedCompany(id: string) {
    setUpdatingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/companies/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          slug: editForm.slug,
          sectorSlug: editForm.sectorSlug,
          logoImage: editForm.logoImage || null,
          heroImage: editForm.heroImage || null,
          websiteUrl: editForm.websiteUrl || null,
          description: editForm.description || null,
          aboutContent: editForm.aboutContent || null,
          facebookUrl: editForm.facebookUrl || null,
          instagramUrl: editForm.instagramUrl || null,
          xUrl: editForm.xUrl || null,
          youtubeUrl: editForm.youtubeUrl || null,
          pinterestUrl: editForm.pinterestUrl || null,
          linkedinUrl: editForm.linkedinUrl || null,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) throw new Error(json.message || 'Update failed');
      await load();
      cancelEditCompany();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <section className={`${dashboardPanelClass} p-5`}>
        <p className="text-sm text-slate-500">Loading companies…</p>
      </section>
    );
  }

  return (
    <section className={dashboardPanelClass}>
      <div className={`flex items-center gap-2 ${dashboardPanelHeaderClass}`}>
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
              className={`mt-1 ${dashboardInputClass}`}
              placeholder="DealsMedi"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">Company slug *</span>
            <input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              className={`mt-1 ${dashboardInputClass}`}
              placeholder="company-slug"
            />
          </label>
          <label className="block md:col-span-2">
            <span className="text-xs font-semibold text-slate-700">Website URL (button link)</span>
            <input
              value={form.websiteUrl}
              onChange={(e) => setForm((f) => ({ ...f, websiteUrl: e.target.value }))}
              className={`mt-1 ${dashboardInputClass}`}
              placeholder="https://example.com"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">Sector *</span>
            <select
              value={form.sectorSlug}
              onChange={(e) => setForm((f) => ({ ...f, sectorSlug: e.target.value }))}
              className={`mt-1 ${dashboardInputClass}`}
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
                <div className={`flex items-center gap-2 p-2 ${dashboardNestedCardClass}`}>
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

          <div className="block md:col-span-2">
            <span className="text-xs font-semibold text-slate-700">Company hero image (big image)</span>
            <p className="mt-0.5 text-[11px] text-slate-500">
              This image shows on the company page (right side), like the DealsMedi example screenshot.
            </p>
            <div className="mt-2 flex flex-wrap items-start gap-3">
              <input
                ref={heroFileRef}
                type="file"
                accept="image/*"
                disabled={heroUploading}
                className="block w-full max-w-xs text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-800 hover:file:bg-slate-200 disabled:opacity-50"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadCompanyHeroImage(file);
                }}
              />
              {form.heroImage ? (
                <div className={`flex items-center gap-2 p-2 ${dashboardNestedCardClass}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.heroImage}
                    alt="Hero image preview"
                    className="h-14 w-20 shrink-0 rounded-lg border border-slate-200 bg-white object-cover"
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] font-mono text-slate-600 break-all">{form.heroImage}</p>
                    <button
                      type="button"
                      onClick={clearCompanyHeroImage}
                      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      <X size={14} aria-hidden />
                      Remove image
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
            {heroUploading ? (
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
            className={`mt-1 min-h-28 ${dashboardInputClass}`}
            placeholder="Short summary shown on sector page."
          />
        </label>

        <label className="mt-4 block">
          <span className="text-xs font-semibold text-slate-700">About content (left-side text on company page)</span>
          <textarea
            value={form.aboutContent}
            onChange={(e) => setForm((f) => ({ ...f, aboutContent: e.target.value }))}
            className={`mt-1 min-h-32 ${dashboardInputClass}`}
            placeholder="Write 1–3 paragraphs. Use blank lines to separate paragraphs."
          />
        </label>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">Facebook</span>
            <input
              value={form.facebookUrl}
              onChange={(e) => setForm((f) => ({ ...f, facebookUrl: e.target.value }))}
              className={`mt-1 ${dashboardInputClass}`}
              placeholder="https://facebook.com/…"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">Instagram</span>
            <input
              value={form.instagramUrl}
              onChange={(e) => setForm((f) => ({ ...f, instagramUrl: e.target.value }))}
              className={`mt-1 ${dashboardInputClass}`}
              placeholder="https://instagram.com/…"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">X (Twitter)</span>
            <input
              value={form.xUrl}
              onChange={(e) => setForm((f) => ({ ...f, xUrl: e.target.value }))}
              className={`mt-1 ${dashboardInputClass}`}
              placeholder="https://x.com/…"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">YouTube</span>
            <input
              value={form.youtubeUrl}
              onChange={(e) => setForm((f) => ({ ...f, youtubeUrl: e.target.value }))}
              className={`mt-1 ${dashboardInputClass}`}
              placeholder="https://youtube.com/…"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">LinkedIn</span>
            <input
              value={form.linkedinUrl}
              onChange={(e) => setForm((f) => ({ ...f, linkedinUrl: e.target.value }))}
              className={`mt-1 ${dashboardInputClass}`}
              placeholder="https://linkedin.com/company/…"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">Pinterest</span>
            <input
              value={form.pinterestUrl}
              onChange={(e) => setForm((f) => ({ ...f, pinterestUrl: e.target.value }))}
              className={`mt-1 ${dashboardInputClass}`}
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
        </div>
        {companies.length === 0 ? (
          <p className="text-sm text-slate-500">No companies yet.</p>
        ) : (
          <ul className={dashboardListFrameClass}>
            {companies.map((c) => (
              <li key={c.id} className="p-4">
                {editCompanyId === c.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <input
                        value={editForm.name}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                        className={dashboardInputClass}
                        placeholder="Company name"
                      />
                      <input
                        value={editForm.slug}
                        onChange={(e) => setEditForm((f) => ({ ...f, slug: e.target.value }))}
                        className={`${dashboardInputClass} font-mono`}
                        placeholder="company-slug"
                      />
                      <select
                        value={editForm.sectorSlug}
                        onChange={(e) => setEditForm((f) => ({ ...f, sectorSlug: e.target.value }))}
                        className={dashboardInputClass}
                      >
                        {COMPANY_DIVISION_SLUGS.map((slug) => {
                          const label = sectors.find((s) => s.slug === slug)?.name ?? slug;
                          return (
                            <option key={slug} value={slug}>
                              {label}
                            </option>
                          );
                        })}
                      </select>
                      <input
                        value={editForm.logoImage}
                        onChange={(e) => setEditForm((f) => ({ ...f, logoImage: e.target.value }))}
                        className={dashboardInputClass}
                        placeholder="Logo URL"
                      />
                      <input
                        value={editForm.heroImage}
                        onChange={(e) => setEditForm((f) => ({ ...f, heroImage: e.target.value }))}
                        className={dashboardInputClass}
                        placeholder="Hero image URL"
                      />
                      <input
                        value={editForm.websiteUrl}
                        onChange={(e) => setEditForm((f) => ({ ...f, websiteUrl: e.target.value }))}
                        className={dashboardInputClass}
                        placeholder="Website URL"
                      />
                    </div>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                      className={`min-h-20 ${dashboardInputClass}`}
                      placeholder="Description"
                    />
                    <textarea
                      value={editForm.aboutContent}
                      onChange={(e) => setEditForm((f) => ({ ...f, aboutContent: e.target.value }))}
                      className={`min-h-28 ${dashboardInputClass}`}
                      placeholder="About content (paragraphs separated by blank lines)"
                    />
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <input
                        value={editForm.facebookUrl}
                        onChange={(e) => setEditForm((f) => ({ ...f, facebookUrl: e.target.value }))}
                        className={dashboardInputClass}
                        placeholder="Facebook URL"
                      />
                      <input
                        value={editForm.instagramUrl}
                        onChange={(e) => setEditForm((f) => ({ ...f, instagramUrl: e.target.value }))}
                        className={dashboardInputClass}
                        placeholder="Instagram URL"
                      />
                      <input
                        value={editForm.xUrl}
                        onChange={(e) => setEditForm((f) => ({ ...f, xUrl: e.target.value }))}
                        className={dashboardInputClass}
                        placeholder="X URL"
                      />
                      <input
                        value={editForm.youtubeUrl}
                        onChange={(e) => setEditForm((f) => ({ ...f, youtubeUrl: e.target.value }))}
                        className={dashboardInputClass}
                        placeholder="YouTube URL"
                      />
                      <input
                        value={editForm.linkedinUrl}
                        onChange={(e) => setEditForm((f) => ({ ...f, linkedinUrl: e.target.value }))}
                        className={dashboardInputClass}
                        placeholder="LinkedIn URL"
                      />
                      <input
                        value={editForm.pinterestUrl}
                        onChange={(e) => setEditForm((f) => ({ ...f, pinterestUrl: e.target.value }))}
                        className={dashboardInputClass}
                        placeholder="Pinterest URL"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => saveEditedCompany(c.id)}
                        disabled={updatingId === c.id || !editForm.name.trim() || !editForm.slug.trim()}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        <Save size={16} />
                        {updatingId === c.id ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditCompany}
                        className={`inline-flex items-center gap-2 ${dashboardHeaderActionSecondary}`}
                      >
                        <X size={16} />
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCompany(c.id)}
                        disabled={deletingId === c.id}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
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
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEditCompany(c)}
                        className={`inline-flex items-center gap-2 ${dashboardHeaderActionSecondary}`}
                      >
                        <Pencil size={16} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCompany(c.id)}
                        disabled={deletingId === c.id}
                        className={`inline-flex items-center gap-2 disabled:opacity-50 ${dashboardHeaderActionSecondary}`}
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

