'use client';

import { useCallback, useEffect, useState } from 'react';
import { Building2, PlusCircle, Save, Trash2 } from 'lucide-react';
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
      <section className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-lg shadow-slate-200/20 p-5">
        <p className="text-sm text-slate-500">Loading companies…</p>
      </section>
    );
  }

  return (
    <section className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-lg shadow-slate-200/20 overflow-hidden">
      <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
        <Building2 size={20} className="text-slate-600" />
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Companies</h2>
          <p className="text-xs text-slate-500 mt-0.5">Add companies and attach them to one of the 12 sectors.</p>
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
                const label = sectors.find((s) => s.slug === slug)?.name ?? slug;
                return (
                  <option key={slug} value={slug}>
                    {label}
                  </option>
                );
              })}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">Company logo (image path/url)</span>
            <input
              value={form.logoImage}
              onChange={(e) => setForm((f) => ({ ...f, logoImage: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="/api/media/dlsin.webp"
            />
          </label>
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
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Existing companies</h3>
        {companies.length === 0 ? (
          <p className="text-sm text-slate-500">No companies yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden bg-white">
            {companies.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{c.name}</p>
                  <p className="text-xs text-slate-500 font-mono">{c.slug}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sector: {c.sector?.name ?? '—'}
                  </p>
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

