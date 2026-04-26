'use client';

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  forwardRef,
} from 'react';
import { createPortal } from 'react-dom';
import {
  BookOpen,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  Pencil,
  Trash2,
} from 'lucide-react';
import FeatureGate from '@/components/FeatureGate';
import GoogleSnippetPreview from '@/components/dashboard/GoogleSnippetPreview';
import BlogSeoScorePanel from '@/components/dashboard/BlogSeoScorePanel';
import { MarketerBlogFields, type MarketerBlogFieldsHandle } from '@/components/dashboard/MarketerBlogFields';
import {
  blogFromApiToForm,
  emptyBlogForm,
  type BlogFormState,
  type BlogListRow,
} from '@/lib/marketer-blog-form';
import { pickCanonicalSectorRows } from '@/lib/company-divisions';
import { getSiteOrigin } from '@/lib/site-origin';
import { publicPathWithLocale } from '@/lib/public-path-with-locale';

type SectorRow = { id: string; name: string; slug: string; description: string | null };

export type StoredImageRow = {
  id: string;
  key: string;
  url: string;
  fileName: string | null;
  altText: string | null;
  size: number | null;
  updatedAt: string;
};

type Props = {
  locale: string;
  authorLabel: string;
  setImages: React.Dispatch<React.SetStateAction<StoredImageRow[]>>;
};

export type MarketerBlogsManagerHandle = {
  requestSave: () => void;
  applyImageFromLibrary: (url: string) => void;
};

function blogStatusBadgeClass(status: string): string {
  switch (status) {
    case 'published':
      return 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-800/60';
    case 'draft':
      return 'bg-amber-100 text-amber-900 ring-1 ring-amber-200/80 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-800/50';
    case 'scheduled':
      return 'bg-sky-100 text-sky-900 ring-1 ring-sky-200/80 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-800/50';
    case 'archived':
      return 'bg-slate-200 text-slate-700 ring-1 ring-slate-300/80 dark:bg-slate-700 dark:text-slate-200 dark:ring-slate-600';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  }
}

function formatBlogApiError(
  data: { message?: string; debug?: string },
  fallback: string,
): string {
  const base =
    typeof data.message === 'string' && data.message.trim() ? data.message.trim() : fallback;
  const dbg = typeof data.debug === 'string' && data.debug.trim() ? data.debug.trim() : '';
  if (!dbg) return base;
  const short = dbg.length > 120 ? `${dbg.slice(0, 117)}…` : dbg;
  return `${base} — ${short}`;
}

function formatUpdatedAt(v: string | Date | null | undefined): string {
  if (v == null || v === '') return '—';
  const d = typeof v === 'string' ? new Date(v) : v;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

/** List UI does not need full HTML bodies; keeps client state light after save/create. */
function blogListRowForState(item: BlogListRow): BlogListRow {
  const { content: _omit, ...rest } = item;
  return { ...rest, content: undefined };
}

const MarketerBlogsManager = forwardRef<MarketerBlogsManagerHandle, Props>(function MarketerBlogsManager(
  { locale, authorLabel, setImages },
  ref,
) {
  const [blogs, setBlogs] = useState<BlogListRow[]>([]);
  const [blogsLoading, setBlogsLoading] = useState(true);
  const [sectors, setSectors] = useState<SectorRow[]>([]);
  const [sectorsLoading, setSectorsLoading] = useState(true);
  const [blogSectorFilter, setBlogSectorFilter] = useState('');
  const [blogStatusFilter, setBlogStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [blogListSearch, setBlogListSearch] = useState('');
  const [blogToast, setBlogToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [blogLoadingSlug, setBlogLoadingSlug] = useState<string | null>(null);
  const [blogActionLoading, setBlogActionLoading] = useState<
    'save' | 'create' | 'draft' | 'delete' | null
  >(null);

  const [blogModalOpen, setBlogModalOpen] = useState(false);
  const [blogModalMode, setBlogModalMode] = useState<'create' | 'edit'>('create');
  const [editingNewsSlug, setEditingNewsSlug] = useState<string | null>(null);
  const [blogForm, setBlogForm] = useState<BlogFormState>(() => emptyBlogForm());
  const blogFieldsRef = useRef<MarketerBlogFieldsHandle>(null);
  const [uploading, setUploading] = useState(false);
  const [previewLink, setPreviewLink] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [domReady, setDomReady] = useState(false);

  useEffect(() => {
    setDomReady(true);
  }, []);

  const refreshBlogs = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true;
    if (!silent) setBlogsLoading(true);
    try {
      const sp = new URLSearchParams();
      if (blogSectorFilter) sp.set('sectorId', blogSectorFilter);
      if (blogStatusFilter === 'published' || blogStatusFilter === 'draft') {
        sp.set('status', blogStatusFilter);
      }
      const qs = sp.toString();
      const res = await fetch(`/api/marketer/news${qs ? `?${qs}` : ''}`);
      const d = res.ok ? await res.json().catch(() => ({})) : {};
      setBlogs((d?.items ?? []) as BlogListRow[]);
    } catch {
      if (!silent) setBlogs([]);
    } finally {
      if (!silent) setBlogsLoading(false);
    }
  }, [blogSectorFilter, blogStatusFilter]);

  useEffect(() => {
    void refreshBlogs();
  }, [refreshBlogs]);

  useEffect(() => {
    fetch('/api/marketer/sectors')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setSectors(pickCanonicalSectorRows((d?.items ?? []) as SectorRow[])))
      .catch(() => setSectors([]))
      .finally(() => setSectorsLoading(false));
  }, []);

  useEffect(() => {
    if (!blogToast) return;
    const t = window.setTimeout(() => setBlogToast(null), 5200);
    return () => window.clearTimeout(t);
  }, [blogToast]);

  useEffect(() => {
    if (!blogModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeBlogModal();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [blogModalOpen]);

  useEffect(() => {
    if (!blogModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [blogModalOpen]);

  const filteredBlogs = useMemo(() => {
    const q = blogListSearch.trim().toLowerCase();
    if (!q) return blogs;
    return blogs.filter(
      (b) =>
        (b.title ?? '').toLowerCase().includes(q) ||
        (b.slug ?? '').toLowerCase().includes(q) ||
        (b.sector?.name ?? '').toLowerCase().includes(q),
    );
  }, [blogs, blogListSearch]);

  const blogsBySector = useMemo(() => {
    const map = new Map<string, { label: string; slug: string; rows: BlogListRow[] }>();
    for (const b of filteredBlogs) {
      const id = b.sectorId ?? '_none';
      const label = b.sector?.name ?? 'No sector assigned';
      const slug = b.sector?.slug ?? '';
      if (!map.has(id)) map.set(id, { label, slug, rows: [] });
      map.get(id)!.rows.push(b);
    }
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [filteredBlogs]);

  function closeBlogModal() {
    setBlogModalOpen(false);
    setPreviewLink(null);
    setEditingNewsSlug(null);
    setBlogForm(emptyBlogForm({ sectorId: blogSectorFilter }));
  }

  function openCreateBlogModal() {
    setBlogModalMode('create');
    setEditingNewsSlug(null);
    setBlogForm(emptyBlogForm({ sectorId: blogSectorFilter }));
    setPreviewLink(null);
    setBlogModalOpen(true);
  }

  async function openEditBlogModal(blog: BlogListRow) {
    setBlogModalMode('edit');
    setEditingNewsSlug(blog.slug);
    setPreviewLink(null);
    setBlogModalOpen(true);
    setBlogLoadingSlug(blog.slug);
    if (typeof blog.content === 'string') {
      setBlogForm(blogFromApiToForm(blog, blog.sectorId ?? blogSectorFilter));
      setBlogLoadingSlug(null);
      return;
    }
    try {
      const res = await fetch(`/api/marketer/news/${encodeURIComponent(blog.slug)}`);
      const data = (await res.json().catch(() => ({}))) as { item?: BlogListRow; message?: string };
      if (!res.ok || !data.item) {
        setBlogForm(blogFromApiToForm(blog, blog.sectorId ?? blogSectorFilter));
        if (!res.ok) {
          setBlogToast({
            type: 'error',
            message: typeof data.message === 'string' ? data.message : 'Could not load this post.',
          });
        }
        return;
      }
      const item = data.item;
      setBlogs((prev) => prev.map((x) => (x.id === item.id ? { ...x, ...item } : x)));
      setBlogForm(blogFromApiToForm(item, item.sectorId ?? blogSectorFilter));
      setEditingNewsSlug(item.slug);
    } catch {
      setBlogForm(blogFromApiToForm(blog, blog.sectorId ?? blogSectorFilter));
      setBlogToast({ type: 'error', message: 'Network error while loading the post.' });
    } finally {
      setBlogLoadingSlug(null);
    }
  }

  async function copyTextToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      setBlogToast({ type: 'error', message: 'Copy failed.' });
    }
  }

  async function createBlogPost(forceDraft = false) {
    if (!blogForm.title.trim() || !blogForm.slug.trim() || !blogForm.content.trim()) {
      setBlogToast({
        type: 'error',
        message: 'Add a title, URL slug, and article body before creating the post.',
      });
      return;
    }
    if (!blogForm.sectorId.trim()) {
      setBlogToast({ type: 'error', message: 'Choose a sector for this post.' });
      return;
    }
    const patches =
      typeof blogFieldsRef.current?.getTranslationPatches === 'function'
        ? blogFieldsRef.current.getTranslationPatches()
        : [];
    const body = {
      ...blogForm,
      ...(forceDraft ? { status: 'draft' as const } : {}),
      translationPatches: patches,
    };
    setBlogActionLoading(forceDraft ? 'draft' : 'create');
    try {
      const res = await fetch('/api/marketer/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        debug?: string;
        item?: BlogListRow;
      };
      if (!res.ok) {
        setBlogToast({
          type: 'error',
          message: formatBlogApiError(
            data,
            `Create failed (${res.status}). The slug may already exist, or scheduling may be disabled.`,
          ),
        });
        return;
      }
      if (!data.item) {
        setBlogToast({ type: 'error', message: 'Create returned no data. Try again.' });
        return;
      }
      const item = data.item;
      const slim = blogListRowForState(item);
      setBlogs((prev) => {
        const rest = prev.filter((b) => b.id !== slim.id && b.slug !== slim.slug);
        return [slim, ...rest];
      });
      void refreshBlogs({ silent: true });
      let msg = 'Post created and saved.';
      if (item.status !== 'published') {
        msg +=
          ' It is not Published yet, so it will not show on the sector news page. Set status to Published and save.';
      } else if (item.sector?.slug) {
        msg += ` It should appear on /news/${item.sector.slug} — hard refresh (⌘⇧R) if needed.`;
      }
      setBlogToast({ type: 'success', message: msg });
      closeBlogModal();
    } catch {
      setBlogToast({ type: 'error', message: 'Create failed (network or server error).' });
    } finally {
      setBlogActionLoading(null);
    }
  }

  async function saveBlogPost(forceDraft = false) {
    const slug = editingNewsSlug;
    if (!slug) {
      setBlogToast({ type: 'error', message: 'Nothing to save.' });
      return;
    }
    const patches =
      typeof blogFieldsRef.current?.getTranslationPatches === 'function'
        ? blogFieldsRef.current.getTranslationPatches()
        : [];
    const payload: Record<string, unknown> = {
      ...blogForm,
      ...(forceDraft ? { status: 'draft' as const } : {}),
      featuredImage: blogForm.featuredImage || null,
      translationPatches: patches,
    };
    setBlogActionLoading(forceDraft ? 'draft' : 'save');
    try {
      const res = await fetch(`/api/marketer/news/${encodeURIComponent(slug)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        debug?: string;
        item?: BlogListRow;
      };
      if (!res.ok) {
        const err = formatBlogApiError(
          data,
          `Save failed (${res.status}). Check scheduling or feature flags.`,
        );
        setBlogToast({ type: 'error', message: err });
        window.alert(err);
        return;
      }
      if (!data.item) {
        // DB save may still succeed when response body is empty/truncated; keep UX deterministic.
        setBlogToast({ type: 'success', message: 'Article Saved.' });
        closeBlogModal();
        void refreshBlogs({ silent: true });
        return;
      }
      const item = data.item;
      const slim = blogListRowForState(item);
      const priorSlug = slug;
      let msg = 'Article Saved.';
      if (item.status !== 'published') {
        msg +=
          ' This post is not Published, so it will not appear on the sector news page yet. Set status to Published and save.';
      } else if (item.sector?.slug) {
        msg += ` Visible on /news/${item.sector.slug} (hard refresh if the list looks old).`;
      }
      setBlogToast({ type: 'success', message: msg });
      setEditingNewsSlug(item.slug);
      setBlogForm(blogFromApiToForm(item, item.sectorId ?? blogSectorFilter));
      setBlogs((prev) => {
        const idx = prev.findIndex((b) => b.slug === priorSlug || b.id === slim.id);
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = { ...next[idx], ...slim, slug: slim.slug };
        return next;
      });
      void refreshBlogs({ silent: true });
      closeBlogModal();
    } catch {
      const err = 'Save failed (network or server error).';
      setBlogToast({ type: 'error', message: err });
      window.alert(err);
    } finally {
      setBlogActionLoading(null);
    }
  }

  async function deleteBlogBySlug(slug: string, title: string) {
    if (!confirm(`Delete “${title}” from the database? This cannot be undone.`)) return;
    setBlogActionLoading('delete');
    try {
      const res = await fetch(`/api/marketer/news/${encodeURIComponent(slug)}`, {
        method: 'DELETE',
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setBlogToast({
          type: 'error',
          message:
            typeof data.message === 'string' && data.message.trim()
              ? data.message.trim()
              : `Delete failed (${res.status}).`,
        });
        return;
      }
      setBlogToast({ type: 'success', message: 'Blog removed from the database and public cache will refresh.' });
      if (editingNewsSlug === slug) closeBlogModal();
      setBlogs((prev) => prev.filter((b) => b.slug !== slug));
      void refreshBlogs({ silent: true });
    } catch {
      setBlogToast({ type: 'error', message: 'Delete failed (network error).' });
    } finally {
      setBlogActionLoading(null);
    }
  }

  async function createPreviewLinkForBlog() {
    const slug = editingNewsSlug || blogForm.slug.trim();
    if (!slug) {
      setBlogToast({ type: 'error', message: 'Enter a slug or save the post before preview.' });
      return;
    }
    setPreviewLoading(true);
    setPreviewLink(null);
    try {
      const payload = JSON.stringify({ kind: 'blog', slug, locale });
      let res = await fetch('/api/preview/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });
      if (res.status === 404) {
        // Backward-compatible alias for deployments that expose `/api/preview` only.
        res = await fetch('/api/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
        });
      }
      const data = (await res.json().catch(() => ({}))) as { url?: string; message?: string };
      if (!res.ok) {
        setBlogToast({
          type: 'error',
          message: data?.message ?? `Failed to create preview link (${res.status}).`,
        });
        return;
      }
      if (data?.url) setPreviewLink(data.url);
    } catch {
      setBlogToast({ type: 'error', message: 'Failed to create preview link' });
    } finally {
      setPreviewLoading(false);
    }
  }

  function requestSaveFromShortcut() {
    if (!blogModalOpen) return;
    if (blogModalMode === 'create') void createBlogPost(false);
    else void saveBlogPost(false);
  }

  useImperativeHandle(ref, () => ({
    requestSave: requestSaveFromShortcut,
    applyImageFromLibrary: (url: string) => {
      if (!blogModalOpen) return;
      setBlogForm((f) => ({ ...f, featuredImage: url, ogImage: f.ogImage || url }));
    },
  }));

  const blogEditorModal =
    blogModalOpen ? (
      <div
        className="fixed inset-0 z-[10000] m-0 flex h-[100dvh] w-screen max-w-none flex-col overflow-hidden p-0"
        role="dialog"
        aria-modal="true"
        aria-labelledby="blog-editor-title"
      >
        <div className="pointer-events-none absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]" aria-hidden />
        <div className="relative flex h-full w-full min-h-0 flex-1 flex-col overflow-hidden bg-white dark:bg-slate-950">
          <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 bg-gradient-to-r from-violet-50 to-white px-4 py-3 dark:border-slate-800 dark:from-violet-950/40 dark:to-slate-900 sm:px-6 sm:py-4">
            <div className="min-w-0 pr-2">
              <h2
                id="blog-editor-title"
                className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl"
              >
                {blogModalMode === 'create' ? 'Create blog' : 'Edit blog'}
              </h2>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                {sectorsLoading
                  ? 'Loading sectors…'
                  : 'Only the form below scrolls. Use the footer to save, save as draft, or cancel.'}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <FeatureGate feature="previewSharing">
                <button
                  type="button"
                  onClick={() => void createPreviewLinkForBlog()}
                  disabled={previewLoading || blogActionLoading !== null}
                  className="hidden rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800 sm:inline-flex sm:text-sm"
                >
                  {previewLoading ? 'Generating…' : 'Preview'}
                </button>
              </FeatureGate>
              <button
                type="button"
                onClick={closeBlogModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label="Close editor"
              >
                <X className="h-5 w-5" strokeWidth={2.25} aria-hidden />
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-4 sm:px-6 sm:py-6">
            <MarketerBlogFields
              ref={blogFieldsRef}
              blogForm={blogForm}
              setBlogForm={setBlogForm}
              sectors={sectors}
              sectorsLoading={sectorsLoading}
              authorLabel={authorLabel}
              uploading={uploading}
              activeBlog={
                blogModalMode === 'edit' && editingNewsSlug
                  ? (blogs.find((x) => x.slug === editingNewsSlug) ?? null)
                  : null
              }
              onUploadFeatured={async (file: File) => {
                setUploading(true);
                try {
                  const form = new FormData();
                  form.append('file', file);
                  if (blogForm.title.trim()) form.append('altText', blogForm.title.trim());
                  const res = await fetch('/api/marketer/stored-image', { method: 'POST', body: form });
                  const data = (await res.json().catch(() => ({}))) as {
                    url?: string;
                    key?: string;
                    id?: string;
                    fileName?: string | null;
                    altText?: string | null;
                    size?: number | null;
                    message?: string;
                  };
                  if (!res.ok) {
                    setBlogToast({
                      type: 'error',
                      message:
                        typeof data.message === 'string' && data.message.trim()
                          ? data.message.trim()
                          : 'Image upload failed.',
                    });
                    return;
                  }
                  const url = data.url ?? '';
                  const nextOg = blogForm.ogImage?.trim() ? blogForm.ogImage.trim() : url;
                  setBlogForm((f) => ({
                    ...f,
                    featuredImage: url,
                    ogImage: f.ogImage?.trim() ? f.ogImage : url,
                  }));
                  setImages((prev) => [
                    {
                      id: data.id ?? `${Date.now()}`,
                      key: data.key ?? '',
                      url,
                      fileName: data.fileName ?? null,
                      altText: data.altText ?? null,
                      size: data.size ?? null,
                      updatedAt: new Date().toISOString(),
                    },
                    ...prev,
                  ]);

                  const slug = editingNewsSlug;
                  if (slug && url) {
                    const patches =
                      typeof blogFieldsRef.current?.getTranslationPatches === 'function'
                        ? blogFieldsRef.current.getTranslationPatches()
                        : [];
                    const patchRes = await fetch(`/api/marketer/news/${encodeURIComponent(slug)}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        featuredImage: url,
                        ogImage: nextOg,
                        translationPatches: patches,
                      }),
                    });
                    const patchData = (await patchRes.json().catch(() => ({}))) as {
                      item?: BlogListRow;
                      message?: string;
                    };
                    if (patchRes.ok && patchData.item) {
                      const item = patchData.item;
                      setBlogs((prev) =>
                        prev.map((b) =>
                          b.slug === slug ? { ...blogListRowForState(item), translations: item.translations } : b,
                        ),
                      );
                      void refreshBlogs({ silent: true });
                      setBlogToast({
                        type: 'success',
                        message: 'Featured image saved as WebP and attached to this post.',
                      });
                    } else {
                      setBlogToast({
                        type: 'error',
                        message:
                          typeof patchData.message === 'string' && patchData.message.trim()
                            ? patchData.message.trim()
                            : 'Image stored, but updating the post failed. Use Save to attach the URL.',
                      });
                    }
                  } else if (url) {
                    setBlogToast({
                      type: 'success',
                      message: 'Image saved as WebP in the library. Save the post to attach it.',
                    });
                  }
                } finally {
                  setUploading(false);
                }
              }}
            />
            {blogForm.featuredImage ? (
              <div className="mt-4">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Featured preview
                </p>
                <div className="flex max-h-[min(56vh,480px)] w-full items-center justify-center overflow-auto rounded-xl border border-slate-200 bg-slate-50/90 p-2 dark:border-slate-600 dark:bg-slate-900/60">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={blogForm.featuredImage}
                    alt="Featured preview"
                    className="h-auto max-h-[min(56vh,480px)] w-full max-w-full object-contain object-center dark:border-slate-700"
                  />
                </div>
              </div>
            ) : null}
            <div className="mt-4">
              <GoogleSnippetPreview
                title={blogForm.metaTitle || blogForm.title}
                description={blogForm.metaDescription}
                url={`${getSiteOrigin().replace(/\/$/, '')}${publicPathWithLocale(locale, 'news', blogForm.slug || 'sample-post')}`}
                ogImage={blogForm.ogImage || blogForm.featuredImage}
              />
              <BlogSeoScorePanel
                title={blogForm.title}
                slug={blogForm.slug}
                metaTitle={blogForm.metaTitle}
                metaDescription={blogForm.metaDescription}
                keywords={blogForm.keywords}
                focusKeyword={blogForm.focusKeyword}
                content={blogForm.content}
                ogImage={blogForm.ogImage || blogForm.featuredImage || null}
              />
            </div>
            <FeatureGate feature="previewSharing">
              <div className="mt-4 flex flex-col gap-2 sm:hidden">
                <button
                  type="button"
                  onClick={() => void createPreviewLinkForBlog()}
                  disabled={previewLoading || blogActionLoading !== null}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200"
                >
                  {previewLoading ? 'Generating…' : 'Preview draft'}
                </button>
              </div>
              {previewLink ? (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                  <a
                    href={previewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-sm text-blue-700 hover:underline dark:text-blue-400"
                  >
                    {previewLink}
                  </a>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void copyTextToClipboard(previewLink)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs dark:border-slate-600"
                    >
                      Copy link
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewLink(null)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs dark:border-slate-600"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ) : null}
            </FeatureGate>
          </div>

          <footer className="flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:px-6 sm:py-4">
            <button
              type="button"
              onClick={closeBlogModal}
              disabled={blogActionLoading !== null}
              className="order-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800 sm:order-none sm:w-auto sm:px-5 sm:py-2.5"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() =>
                void (blogModalMode === 'create' ? createBlogPost(true) : saveBlogPost(true))
              }
              disabled={
                blogActionLoading !== null ||
                (blogModalMode === 'create' &&
                  (!blogForm.sectorId.trim() ||
                    !blogForm.title.trim() ||
                    !blogForm.slug.trim() ||
                    !blogForm.content.trim()))
              }
              className="order-2 w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950 transition hover:bg-amber-100 disabled:opacity-50 dark:border-amber-900/50 dark:bg-amber-950/35 dark:text-amber-100 dark:hover:bg-amber-950/55 sm:order-none sm:w-auto sm:px-5 sm:py-2.5"
            >
              {blogActionLoading === 'draft' ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Saving draft…
                </span>
              ) : (
                'Draft'
              )}
            </button>
            <button
              type="button"
              onClick={() =>
                void (blogModalMode === 'create' ? createBlogPost(false) : saveBlogPost(false))
              }
              disabled={
                blogActionLoading !== null ||
                (blogModalMode === 'create' &&
                  (!blogForm.sectorId.trim() ||
                    !blogForm.title.trim() ||
                    !blogForm.slug.trim() ||
                    !blogForm.content.trim()))
              }
              className="order-3 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50 dark:bg-violet-600 dark:hover:bg-violet-500 sm:order-none sm:w-auto sm:px-6 sm:py-2.5"
            >
              {blogActionLoading === 'save' || blogActionLoading === 'create' ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Saving…
                </span>
              ) : blogModalMode === 'create' ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Plus className="h-4 w-4" aria-hidden />
                  Save
                </span>
              ) : (
                'Save'
              )}
            </button>
          </footer>
        </div>
      </div>
    ) : null;

  return (
    <>
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/30">
      {blogToast ? (
        <div
          role="status"
          className={`flex items-start gap-3 border-b px-4 py-3 text-sm sm:px-6 ${
            blogToast.type === 'success'
              ? 'border-emerald-200/80 bg-emerald-50/95 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/35 dark:text-emerald-100'
              : 'border-red-200/80 bg-red-50/95 text-red-950 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100'
          }`}
        >
          {blogToast.type === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
          ) : (
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" aria-hidden />
          )}
          <p className="min-w-0 flex-1 leading-snug">{blogToast.message}</p>
          <button
            type="button"
            onClick={() => setBlogToast(null)}
            className="shrink-0 rounded-lg p-1 text-slate-500 transition hover:bg-black/5 hover:text-slate-800 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 border-b border-slate-100/95 bg-gradient-to-r from-slate-50/98 via-white to-violet-50/30 p-5 dark:border-slate-800 dark:from-slate-800/45 dark:via-slate-900/85 dark:to-violet-950/20 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-6 sm:px-8">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md ring-1 ring-violet-500/30">
            <BookOpen size={22} strokeWidth={2} aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">
              Blogs
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Posts are grouped by sector (same division as the public <span className="font-mono">/news/…</span>{' '}
              pages). Use filters, then <strong className="text-slate-800 dark:text-slate-200">Create blog</strong> or{' '}
              <strong className="text-slate-800 dark:text-slate-200">Edit</strong> /{' '}
              <strong className="text-slate-800 dark:text-slate-200">Delete</strong> on each row.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreateBlogModal}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-600/20 transition hover:bg-violet-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 dark:shadow-violet-900/40"
        >
          <Plus size={18} strokeWidth={2.5} aria-hidden />
          Create blog
        </button>
      </div>

      <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/30 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4 sm:px-6">
        <div className="min-w-[10rem] flex-1 sm:max-w-xs">
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Sector
          </label>
          <select
            value={blogSectorFilter}
            onChange={(e) => setBlogSectorFilter(e.target.value)}
            className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="">All sectors</option>
            {sectors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[10rem] flex-1 sm:max-w-[12rem]">
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Status
          </label>
          <select
            value={blogStatusFilter}
            onChange={(e) => setBlogStatusFilter(e.target.value as 'all' | 'published' | 'draft')}
            className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
        <div className="min-w-0 flex-[2] sm:max-w-md">
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Search
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              type="search"
              value={blogListSearch}
              onChange={(e) => setBlogListSearch(e.target.value)}
              placeholder="Title, slug, sector…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 shadow-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {blogsLoading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" aria-hidden />
            Loading blogs…
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-10 text-center text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-400">
            {blogs.length === 0
              ? 'No blogs match these filters. Click “Create blog” to add one.'
              : 'No blogs match your search. Try clearing search or changing filters.'}
          </div>
        ) : (
          <div className="space-y-10">
            {blogsBySector.map((group) => (
              <div key={group.label + group.slug}>
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 pb-2 dark:border-slate-700">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">{group.label}</h3>
                  {group.slug ? (
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400">/news/{group.slug}</span>
                  ) : null}
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/80 dark:text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Title</th>
                        <th className="px-4 py-3">Slug</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Updated</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {group.rows.map((b) => (
                        <tr key={b.id} className="bg-white dark:bg-slate-900/40">
                          <td className="max-w-[220px] px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                            <span className="line-clamp-2">{b.title}</span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                            {blogLoadingSlug === b.slug ? (
                              <Loader2 className="inline h-4 w-4 animate-spin text-violet-500" aria-hidden />
                            ) : null}{' '}
                            {b.slug}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize ${blogStatusBadgeClass(b.status)}`}
                            >
                              {b.status}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-400">
                            {formatUpdatedAt(b.updatedAt)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex flex-wrap justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => void openEditBlogModal(b)}
                                disabled={blogActionLoading !== null}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                              >
                                <Pencil className="h-3.5 w-3.5" aria-hidden />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => void deleteBlogBySlug(b.slug, b.title)}
                                disabled={blogActionLoading !== null}
                                className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200 dark:hover:bg-red-950/50"
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </section>
    {domReady && blogEditorModal ? createPortal(blogEditorModal, document.body) : null}
    </>
  );
});

export default MarketerBlogsManager;
