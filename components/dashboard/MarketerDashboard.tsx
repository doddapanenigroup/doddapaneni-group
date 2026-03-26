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
  Image as ImageIcon,
  Search,
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

type SeoFields = {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
};

type PageContentRow = {
  id: string;
  pageKey: string;
  slug: string;
  locale: string;
  title: string;
  body: string;
  metaTitle: string | null;
  metaDescription: string | null;
  keywords: string | null;
  canonicalUrl: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
};

type BlogRow = {
  id: string;
  title: string;
  slug: string;
  content: string;
  featuredImage: string | null;
  status: 'draft' | 'published';
  publishedAt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  keywords: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
};

type StoredImageRow = {
  id: string;
  key: string;
  url: string;
  fileName: string | null;
  altText: string | null;
  size: number | null;
  updatedAt: string;
};

function GoogleSnippetPreview({
  title,
  description,
  url,
}: {
  title: string;
  description: string;
  url: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500 mb-1">Google preview</p>
      <p className="text-sm text-emerald-700 truncate">{url || 'https://example.com/page-url'}</p>
      <p className="text-[18px] leading-6 text-blue-700 hover:underline truncate">
        {title || 'Your page title appears here'}
      </p>
      <p className="text-sm text-slate-600 line-clamp-2">
        {description || 'Your meta description appears here for search users.'}
      </p>
    </div>
  );
}

export default function MarketerDashboard({ locale }: { locale: string }) {
  const base = `/${locale}`;
  const [activeTab, setActiveTab] = useState<'campaigns' | 'links' | 'pages' | 'blogs'>('pages');

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

  // ——— Content pages + SEO ———
  const [pages, setPages] = useState<PageContentRow[]>([]);
  const [pagesLoading, setPagesLoading] = useState(true);
  const [selectedPageSlug, setSelectedPageSlug] = useState('');
  const [pageForm, setPageForm] = useState({
    title: '',
    body: '',
    seoNote: '',
    metaTitle: '',
    metaDescription: '',
    keywords: '',
    canonicalUrl: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
  });

  // ——— Blog + SEO ———
  const [blogs, setBlogs] = useState<BlogRow[]>([]);
  const [blogsLoading, setBlogsLoading] = useState(true);
  const [selectedBlogSlug, setSelectedBlogSlug] = useState('');
  const [blogForm, setBlogForm] = useState({
    title: '',
    slug: '',
    content: '',
    featuredImage: '',
    status: 'draft' as 'draft' | 'published',
    seoNote: '',
    metaTitle: '',
    metaDescription: '',
    keywords: '',
    canonicalUrl: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
  });

  // ——— Stored media picker ———
  const [images, setImages] = useState<StoredImageRow[]>([]);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [imageSearch, setImageSearch] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch('/api/marketer/page-content?locale=en')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const items = (d?.items ?? []) as PageContentRow[];
        setPages(items);
        if (items[0]) selectPage(items[0]);
      })
      .catch(() => setPages([]))
      .finally(() => setPagesLoading(false));
  }, []);

  useEffect(() => {
    fetch('/api/marketer/blog')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const items = (d?.items ?? []) as BlogRow[];
        setBlogs(items);
        if (items[0]) selectBlog(items[0]);
      })
      .catch(() => setBlogs([]))
      .finally(() => setBlogsLoading(false));
  }, []);

  useEffect(() => {
    fetch('/api/marketer/stored-image')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setImages((d?.items ?? []) as StoredImageRow[]))
      .catch(() => setImages([]))
      .finally(() => setImagesLoading(false));
  }, []);

  function selectPage(page: PageContentRow) {
    setSelectedPageSlug(page.slug);
    setPageForm({
      title: page.title ?? '',
      body: page.body ?? '',
      seoNote: '',
      metaTitle: page.metaTitle ?? '',
      metaDescription: page.metaDescription ?? '',
      keywords: page.keywords ?? '',
      canonicalUrl: page.canonicalUrl ?? '',
      ogTitle: page.ogTitle ?? '',
      ogDescription: page.ogDescription ?? '',
      ogImage: page.ogImage ?? '',
    });
  }

  function selectBlog(blog: BlogRow) {
    setSelectedBlogSlug(blog.slug);
    setBlogForm({
      title: blog.title ?? '',
      slug: blog.slug ?? '',
      content: blog.content ?? '',
      featuredImage: blog.featuredImage ?? '',
      status: blog.status ?? 'draft',
      seoNote: '',
      metaTitle: blog.metaTitle ?? '',
      metaDescription: blog.metaDescription ?? '',
      keywords: blog.keywords ?? '',
      canonicalUrl: '',
      ogTitle: blog.ogTitle ?? '',
      ogDescription: blog.ogDescription ?? '',
      ogImage: blog.ogImage ?? '',
    });
  }

  async function savePageSeo() {
    if (!selectedPageSlug) return;
    const res = await fetch(`/api/marketer/page-content/${encodeURIComponent(selectedPageSlug)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pageForm),
    });
    const data = await res.json();
    if (!res.ok) return;
    const item = data.item as PageContentRow;
    setPages((prev) => prev.map((p) => (p.id === item.id ? ({ ...p, ...item }) : p)));
    setPageForm((f) => ({ ...f, seoNote: '' }));
  }

  async function saveBlogSeo() {
    if (!selectedBlogSlug) return;
    const payload = {
      ...blogForm,
      featuredImage: blogForm.featuredImage || null,
    };
    const res = await fetch(`/api/marketer/blog/${encodeURIComponent(selectedBlogSlug)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return;
    const item = data.item as BlogRow;
    setBlogs((prev) => prev.map((b) => (b.id === item.id ? ({ ...b, ...item }) : b)));
    setBlogForm((f) => ({ ...f, seoNote: '' }));
  }

  async function createBlog() {
    if (!blogForm.title.trim() || !blogForm.slug.trim() || !blogForm.content.trim()) return;
    const res = await fetch('/api/marketer/blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(blogForm),
    });
    const data = await res.json();
    if (!res.ok) return;
    const item = data.item as BlogRow;
    setBlogs((prev) => [item, ...prev]);
    selectBlog(item);
  }

  async function uploadImage(file: File, altText: string) {
    const form = new FormData();
    form.append('file', file);
    if (altText.trim()) form.append('altText', altText.trim());
    setUploading(true);
    try {
      const res = await fetch('/api/marketer/stored-image', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) return;
      setImages((prev) => [
        {
          id: data.id ?? `${Date.now()}`,
          key: data.key,
          url: data.url,
          fileName: data.fileName ?? null,
          altText: data.altText ?? null,
          size: data.size ?? null,
          updatedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    } finally {
      setUploading(false);
    }
  }

  const filteredImages = images.filter((i) => {
    if (!imageSearch.trim()) return true;
    const t = imageSearch.toLowerCase();
    return (
      i.key.toLowerCase().includes(t) ||
      (i.fileName ?? '').toLowerCase().includes(t) ||
      (i.altText ?? '').toLowerCase().includes(t)
    );
  });

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

      <section className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200/80 shadow-lg p-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'pages', label: 'Pages' },
            { id: 'blogs', label: 'Blogs' },
            { id: 'campaigns', label: 'Campaigns' },
            { id: 'links', label: 'Tools' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3 py-2 rounded-lg text-sm border ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-700 border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {activeTab === 'pages' && (
        <section className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200/80 shadow-lg overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50">
            <h2 className="text-lg font-semibold text-slate-800">Pages management + SEO</h2>
            <p className="text-sm text-slate-600 mt-1">Select a page, update content, then save.</p>
          </div>
          <div className="p-5 grid lg:grid-cols-3 gap-5">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Pages</p>
              {pagesLoading ? (
                <p className="text-sm text-slate-500">Loading pages...</p>
              ) : (
                <div className="max-h-[420px] overflow-auto space-y-2">
                  {pages.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectPage(p)}
                      className={`w-full text-left p-3 rounded-lg border ${
                        selectedPageSlug === p.slug
                          ? 'border-slate-700 bg-slate-100'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <p className="text-sm font-medium text-slate-900">{p.title}</p>
                      <p className="text-xs text-slate-500">/{p.slug}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="lg:col-span-2 space-y-3">
              <input
                value={pageForm.title}
                onChange={(e) => setPageForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Page title"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <textarea
                value={pageForm.body}
                onChange={(e) => setPageForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="Page content"
                rows={6}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <div className="grid sm:grid-cols-2 gap-3">
                <input value={pageForm.metaTitle} onChange={(e) => setPageForm((f) => ({ ...f, metaTitle: e.target.value }))} placeholder="Meta title" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <input value={pageForm.keywords} onChange={(e) => setPageForm((f) => ({ ...f, keywords: e.target.value }))} placeholder="Keywords (comma-separated)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <input value={pageForm.canonicalUrl} onChange={(e) => setPageForm((f) => ({ ...f, canonicalUrl: e.target.value }))} placeholder="Canonical URL" className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
                <textarea value={pageForm.metaDescription} onChange={(e) => setPageForm((f) => ({ ...f, metaDescription: e.target.value }))} placeholder="Meta description" rows={3} className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
                <input value={pageForm.ogTitle} onChange={(e) => setPageForm((f) => ({ ...f, ogTitle: e.target.value }))} placeholder="OG title" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <input value={pageForm.ogImage} onChange={(e) => setPageForm((f) => ({ ...f, ogImage: e.target.value }))} placeholder="OG image URL" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <textarea value={pageForm.ogDescription} onChange={(e) => setPageForm((f) => ({ ...f, ogDescription: e.target.value }))} placeholder="OG description" rows={2} className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
              </div>
              <input
                value={pageForm.seoNote}
                onChange={(e) => setPageForm((f) => ({ ...f, seoNote: e.target.value }))}
                placeholder="Note for team (saved in logs)"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <GoogleSnippetPreview
                title={pageForm.metaTitle || pageForm.title}
                description={pageForm.metaDescription}
                url={pageForm.canonicalUrl || `https://doddapanenigroup.net/${locale}/${selectedPageSlug || ''}`}
              />
              <button type="button" onClick={savePageSeo} className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm">
                Save page changes
              </button>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'blogs' && (
        <section className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200/80 shadow-lg overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50">
            <h2 className="text-lg font-semibold text-slate-800">Blog management + SEO</h2>
          </div>
          <div className="p-5 grid lg:grid-cols-3 gap-5">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Blog posts</p>
              {blogsLoading ? (
                <p className="text-sm text-slate-500">Loading blogs...</p>
              ) : (
                <div className="max-h-[420px] overflow-auto space-y-2">
                  {blogs.map((b) => (
                    <button key={b.id} type="button" onClick={() => selectBlog(b)} className={`w-full text-left p-3 rounded-lg border ${selectedBlogSlug === b.slug ? 'border-slate-700 bg-slate-100' : 'border-slate-200 bg-white'}`}>
                      <p className="text-sm font-medium text-slate-900">{b.title}</p>
                      <p className="text-xs text-slate-500">/{b.slug}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="lg:col-span-2 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <input value={blogForm.title} onChange={(e) => setBlogForm((f) => ({ ...f, title: e.target.value }))} placeholder="Blog title" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <input value={blogForm.slug} onChange={(e) => setBlogForm((f) => ({ ...f, slug: e.target.value }))} placeholder="Slug (example: best-packers-movers)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <textarea value={blogForm.content} onChange={(e) => setBlogForm((f) => ({ ...f, content: e.target.value }))} placeholder="Blog content" rows={8} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <div className="grid sm:grid-cols-2 gap-3">
                <select value={blogForm.status} onChange={(e) => setBlogForm((f) => ({ ...f, status: e.target.value as 'draft' | 'published' }))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
                <input value={blogForm.featuredImage} onChange={(e) => setBlogForm((f) => ({ ...f, featuredImage: e.target.value }))} placeholder="Featured image URL" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <input value={blogForm.metaTitle} onChange={(e) => setBlogForm((f) => ({ ...f, metaTitle: e.target.value }))} placeholder="Meta title" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <input value={blogForm.keywords} onChange={(e) => setBlogForm((f) => ({ ...f, keywords: e.target.value }))} placeholder="Keywords" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <textarea value={blogForm.metaDescription} onChange={(e) => setBlogForm((f) => ({ ...f, metaDescription: e.target.value }))} placeholder="Meta description" rows={3} className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
                <input value={blogForm.ogTitle} onChange={(e) => setBlogForm((f) => ({ ...f, ogTitle: e.target.value }))} placeholder="OG title" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <input value={blogForm.ogImage} onChange={(e) => setBlogForm((f) => ({ ...f, ogImage: e.target.value }))} placeholder="OG image URL" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <textarea value={blogForm.ogDescription} onChange={(e) => setBlogForm((f) => ({ ...f, ogDescription: e.target.value }))} placeholder="OG description" rows={2} className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
              </div>
              <input value={blogForm.seoNote} onChange={(e) => setBlogForm((f) => ({ ...f, seoNote: e.target.value }))} placeholder="Note for team (saved in logs)" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <GoogleSnippetPreview title={blogForm.metaTitle || blogForm.title} description={blogForm.metaDescription} url={`https://doddapanenigroup.net/${locale}/blog/${blogForm.slug || ''}`} />
              <div className="flex gap-2 flex-wrap">
                <button type="button" onClick={saveBlogSeo} className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm">Save blog</button>
                <button type="button" onClick={createBlog} className="px-4 py-2 rounded-lg border border-slate-300 text-sm text-slate-700">Create new blog</button>
              </div>
            </div>
          </div>
        </section>
      )}

      {(activeTab === 'pages' || activeTab === 'blogs') && (
        <section className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200/80 shadow-lg overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <ImageIcon size={18} className="text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-800">Media library (StoredImage)</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid sm:grid-cols-3 gap-3 items-center">
              <label className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 cursor-pointer bg-white">
                Upload image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    uploadImage(file, '');
                  }}
                />
              </label>
              <div className="sm:col-span-2 flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 bg-white">
                <Search size={16} className="text-slate-500" />
                <input
                  value={imageSearch}
                  onChange={(e) => setImageSearch(e.target.value)}
                  placeholder="Search by file name / alt text"
                  className="w-full text-sm outline-none bg-transparent"
                />
              </div>
            </div>
            {imagesLoading || uploading ? (
              <p className="text-sm text-slate-500">Loading media...</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {filteredImages.slice(0, 24).map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    className="text-left rounded-lg border border-slate-200 p-2 hover:border-slate-400"
                    onClick={() => {
                      if (activeTab === 'pages') {
                        setPageForm((f) => ({ ...f, ogImage: img.url }));
                      } else {
                        setBlogForm((f) => ({ ...f, featuredImage: img.url, ogImage: img.url }));
                      }
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.altText ?? img.fileName ?? 'image'} className="w-full h-24 object-cover rounded-md mb-2" />
                    <p className="text-xs font-medium text-slate-800 truncate">{img.fileName ?? img.key}</p>
                    <p className="text-[11px] text-slate-500 truncate">{img.key}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Campaigns */}
      {activeTab === 'campaigns' && (
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
      )}

      {/* Marketing tools / links */}
      {activeTab === 'links' && (
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
      )}

      <MyActivityPanel />
    </div>
  );
}
