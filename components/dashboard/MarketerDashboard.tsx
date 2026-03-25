'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Megaphone,
  Globe,
  Mail,
  Target,
  Link2,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import VisitStats from './VisitStats';
import MyActivityPanel from './MyActivityPanel';

type CampaignStatus = 'draft' | 'active' | 'paused' | 'ended';
type Campaign = {
  id: string;
  name: string;
  description: string;
  url: string;
  status: CampaignStatus;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
};

type MarketingLinkType = 'tool' | 'integration' | 'resource' | 'other';
type MarketingLink = {
  id: string;
  name: string;
  url: string;
  description: string;
  type: MarketingLinkType;
  createdAt: string;
  updatedAt: string;
};

export default function MarketerDashboard({ locale }: { locale: string }) {
  const base = `/${locale}`;

  // ——— Campaigns ———
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    description: '',
    url: '',
    status: 'draft' as CampaignStatus,
    startDate: '',
    endDate: '',
    seoNote: '',
  });

  useEffect(() => {
    fetch('/api/marketer/campaigns')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setCampaigns(data?.campaigns ?? []))
      .catch(() => setCampaigns([]))
      .finally(() => setCampaignsLoading(false));
  }, []);

  function openCampaignForm(c?: Campaign) {
    if (c) {
      setEditingCampaignId(c.id);
      setCampaignForm({
        name: c.name,
        description: c.description,
        url: c.url,
        status: c.status,
        startDate: c.startDate ? c.startDate.slice(0, 10) : '',
        endDate: c.endDate ? c.endDate.slice(0, 10) : '',
        seoNote: '',
      });
    } else {
      setEditingCampaignId(null);
      setCampaignForm({
        name: '',
        description: '',
        url: '',
        status: 'draft',
        startDate: '',
        endDate: '',
        seoNote: '',
      });
    }
    setShowCampaignForm(true);
  }

  function closeCampaignForm() {
    setShowCampaignForm(false);
    setEditingCampaignId(null);
  }

  async function handleSaveCampaign() {
    const payload = {
      name: campaignForm.name.trim(),
      description: campaignForm.description.trim(),
      url: campaignForm.url.trim(),
      status: campaignForm.status,
      startDate: campaignForm.startDate || null,
      endDate: campaignForm.endDate || null,
    };
    if (!payload.name || !payload.url) return;
    try {
      if (editingCampaignId) {
        const res = await fetch(`/api/marketer/campaigns/${editingCampaignId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message ?? 'Failed');
        setCampaigns((prev) =>
          prev.map((c) => (c.id === editingCampaignId ? data.campaign : c))
        );
      } else {
        const res = await fetch('/api/marketer/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message ?? 'Failed');
        setCampaigns((prev) => [data.campaign, ...prev]);
      }
      closeCampaignForm();
    } catch {
      // could set error state
    }
  }

  async function handleDeleteCampaign(id: string) {
    if (!confirm('Delete this campaign?')) return;
    const res = await fetch(`/api/marketer/campaigns/${id}`, { method: 'DELETE' });
    if (res.ok) setCampaigns((prev) => prev.filter((c) => c.id !== id));
  }

  // ——— Marketing links ———
  const [links, setLinks] = useState<MarketingLink[]>([]);
  const [linksLoading, setLinksLoading] = useState(true);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [linkForm, setLinkForm] = useState({
    name: '',
    url: '',
    description: '',
    type: 'resource' as MarketingLinkType,
    seoNote: '',
  });

  useEffect(() => {
    fetch('/api/marketer/links')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setLinks(data?.links ?? []))
      .catch(() => setLinks([]))
      .finally(() => setLinksLoading(false));
  }, []);

  function openLinkForm(l?: MarketingLink) {
    if (l) {
      setEditingLinkId(l.id);
      setLinkForm({
        name: l.name,
        url: l.url,
        description: l.description,
        type: l.type,
        seoNote: '',
      });
    } else {
      setEditingLinkId(null);
      setLinkForm({ name: '', url: '', description: '', type: 'resource', seoNote: '' });
    }
    setShowLinkForm(true);
  }

  function closeLinkForm() {
    setShowLinkForm(false);
    setEditingLinkId(null);
  }

  async function handleSaveLink() {
    const payload = {
      name: linkForm.name.trim(),
      url: linkForm.url.trim(),
      description: linkForm.description.trim(),
      type: linkForm.type,
      seoNote: linkForm.seoNote.trim() || undefined,
    };
    if (!payload.name || !payload.url) return;
    try {
      if (editingLinkId) {
        const res = await fetch(`/api/marketer/links/${editingLinkId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message ?? 'Failed');
        setLinks((prev) =>
          prev.map((l) => (l.id === editingLinkId ? data.link : l))
        );
      } else {
        const res = await fetch('/api/marketer/links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message ?? 'Failed');
        setLinks((prev) => [data.link, ...prev]);
      }
      closeLinkForm();
    } catch {
      // could set error state
    }
  }

  async function handleDeleteLink(id: string) {
    if (!confirm('Remove this link?')) return;
    const res = await fetch(`/api/marketer/links/${id}`, { method: 'DELETE' });
    if (res.ok) setLinks((prev) => prev.filter((l) => l.id !== id));
  }

  return (
    <div className="space-y-8">
      <header className="rounded-2xl bg-slate-800 text-white p-6 shadow-xl border border-slate-600">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone size={28} className="opacity-90" />
          Digital Marketer Dashboard
        </h1>
        <p className="mt-1 opacity-90 text-sm">
          Analytics, campaigns, and marketing tools. All data is stored in the database.
        </p>
      </header>

      <section className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200/80 shadow-lg overflow-hidden">
        <h2 className="text-lg font-semibold text-slate-800 p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
          <Globe size={20} className="text-slate-600" />
          Quick links
        </h2>
        <div className="p-5 grid gap-3 sm:grid-cols-2">
          <Link
            href={base}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-100 transition-all"
          >
            <Globe size={22} className="text-slate-600" />
            <span className="font-medium text-slate-800">View site</span>
          </Link>
          <Link
            href={`${base}/contact`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-100 transition-all"
          >
            <Mail size={22} className="text-slate-600" />
            <span className="font-medium text-slate-800">Contact page</span>
          </Link>
        </div>
      </section>

      <VisitStats />

      {/* Campaigns */}
      <section className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200/80 shadow-lg overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Target size={20} className="text-slate-600" />
            Campaign management
          </h2>
          <button
            type="button"
            onClick={() => openCampaignForm()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700 text-white text-sm font-medium hover:bg-slate-800"
          >
            <Plus size={18} />
            Add campaign
          </button>
        </div>
        <div className="p-5">
          {showCampaignForm && (
            <div className="mb-5 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <input
                type="text"
                placeholder="Campaign name"
                value={campaignForm.name}
                onChange={(e) => setCampaignForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                type="url"
                placeholder="URL"
                value={campaignForm.url}
                onChange={(e) => setCampaignForm((f) => ({ ...f, url: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <textarea
                placeholder="Description"
                value={campaignForm.description}
                onChange={(e) => setCampaignForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <textarea
                placeholder="SEO / tracking note (e.g. target keyword, landing page) — stored in activity log"
                value={campaignForm.seoNote}
                onChange={(e) => setCampaignForm((f) => ({ ...f, seoNote: e.target.value }))}
                rows={2}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <div className="flex flex-wrap gap-3 items-center">
                <select
                  value={campaignForm.status}
                  onChange={(e) =>
                    setCampaignForm((f) => ({ ...f, status: e.target.value as CampaignStatus }))
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="ended">Ended</option>
                </select>
                <input
                  type="date"
                  placeholder="Start date"
                  value={campaignForm.startDate}
                  onChange={(e) => setCampaignForm((f) => ({ ...f, startDate: e.target.value }))}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  type="date"
                  placeholder="End date"
                  value={campaignForm.endDate}
                  onChange={(e) => setCampaignForm((f) => ({ ...f, endDate: e.target.value }))}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={handleSaveCampaign}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-700 text-white text-sm"
                >
                  <Check size={16} />
                  {editingCampaignId ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={closeCampaignForm}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm"
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            </div>
          )}
          {campaignsLoading ? (
            <p className="text-slate-500 text-sm">Loading campaigns…</p>
          ) : campaigns.length === 0 ? (
            <p className="text-slate-500 text-sm">No campaigns yet. Add one to get started.</p>
          ) : (
            <ul className="space-y-2">
              {campaigns.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-500 truncate">{c.url}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs bg-slate-200 text-slate-700">
                      {c.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg text-slate-500 hover:bg-slate-200"
                      title="Open URL"
                    >
                      <ExternalLink size={16} />
                    </a>
                    <button
                      type="button"
                      onClick={() => openCampaignForm(c)}
                      className="p-2 rounded-lg text-slate-600 hover:bg-slate-200"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCampaign(c.id)}
                      className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Marketing tools / links */}
      <section className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200/80 shadow-lg overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Link2 size={20} className="text-slate-600" />
            Marketing tools &amp; integrations
          </h2>
          <button
            type="button"
            onClick={() => openLinkForm()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700 text-white text-sm font-medium hover:bg-slate-800"
          >
            <Plus size={18} />
            Add link
          </button>
        </div>
        <div className="p-5">
          {showLinkForm && (
            <div className="mb-5 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <input
                type="text"
                placeholder="Name"
                value={linkForm.name}
                onChange={(e) => setLinkForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                type="url"
                placeholder="URL"
                value={linkForm.url}
                onChange={(e) => setLinkForm((f) => ({ ...f, url: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Description"
                value={linkForm.description}
                onChange={(e) => setLinkForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="SEO note (optional) — logged with this change"
                value={linkForm.seoNote}
                onChange={(e) => setLinkForm((f) => ({ ...f, seoNote: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <div className="flex flex-wrap gap-3 items-center">
                <select
                  value={linkForm.type}
                  onChange={(e) =>
                    setLinkForm((f) => ({ ...f, type: e.target.value as MarketingLinkType }))
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="tool">Tool</option>
                  <option value="integration">Integration</option>
                  <option value="resource">Resource</option>
                  <option value="other">Other</option>
                </select>
                <button
                  type="button"
                  onClick={handleSaveLink}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-700 text-white text-sm"
                >
                  <Check size={16} />
                  {editingLinkId ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={closeLinkForm}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm"
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            </div>
          )}
          {linksLoading ? (
            <p className="text-slate-500 text-sm">Loading…</p>
          ) : links.length === 0 ? (
            <p className="text-slate-500 text-sm">No links yet. Add tools, integrations, or resources.</p>
          ) : (
            <ul className="space-y-2">
              {links.map((l) => (
                <li
                  key={l.id}
                  className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{l.name}</p>
                    {l.description && (
                      <p className="text-xs text-slate-500">{l.description}</p>
                    )}
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs bg-slate-200 text-slate-800">
                      {l.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg text-slate-500 hover:bg-slate-200"
                      title="Open"
                    >
                      <ExternalLink size={16} />
                    </a>
                    <button
                      type="button"
                      onClick={() => openLinkForm(l)}
                      className="p-2 rounded-lg text-slate-600 hover:bg-slate-200"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteLink(l.id)}
                      className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <MyActivityPanel />
    </div>
  );
}
