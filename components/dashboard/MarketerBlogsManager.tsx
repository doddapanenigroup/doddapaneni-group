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
import { useRouter } from 'next/navigation';
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
  marketerBlogFormApiPayload,
  type BlogFormState,
  type BlogListRow,
} from '@/lib/marketer-blog-form';
import { pickCanonicalSectorRows } from '@/lib/company-divisions';
import { getSiteOrigin } from '@/lib/site-origin';
import {
  dashboardDashedFoldClass,
  dashboardHeaderActionPrimary,
  dashboardHeaderActionSecondary,
  dashboardIconButtonClass,
  dashboardInputClass,
  dashboardNestedCardClass,
  dashboardPanelClass,
  dashboardPanelHeaderClass,
} from '@/lib/dashboard-ui';
import { publicPathForLocale, publicPathWithLocale } from '@/lib/public-path-with-locale';
import {
  BLOG_LIVE_PREVIEW_MSG_V,
  blogLivePreviewChannelName,
  normalizeBlogPreviewImage,
  type BlogLivePreviewPayload,
} from '@/lib/blog-live-preview';

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
  const [blogsLoading, setBlogsLoading] = useState(false);
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
  const featuredImageUploadInFlight = useRef(false);
  const [uploading, setUploading] = useState(false);
  const [livePreviewChannelId, setLivePreviewChannelId] = useState<string | null>(null);
  const livePreviewBcRef = useRef<BroadcastChannel | null>(null);
  const didAutoSelectSectorRef = useRef(false);
  const [domReady, setDomReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setDomReady(true);
  }, []);

  /** Warm the live preview route chunk so the new tab opens faster. */
  useEffect(() => {
    router.prefetch(publicPathForLocale(locale, '/preview/live'));
  }, [locale, router]);

  /** Default to the first sector once so the list loads immediately; user can still pick “Select sector…”. */
  useEffect(() => {
    if (sectorsLoading || sectors.length === 0) return;
    if (didAutoSelectSectorRef.current) return;
    didAutoSelectSectorRef.current = true;
    setBlogSectorFilter((prev) => (prev.trim() === '' ? sectors[0].id : prev));
  }, [sectorsLoading, sectors]);

  const blogListSectorSelected = blogSectorFilter.trim().length > 0;

  const refreshBlogs = useCallback(
    async (opts?: { silent?: boolean; sectorIdOverride?: string | null }) => {
      const silent = opts?.silent === true;
      const sector =
        typeof opts?.sectorIdOverride === 'string' && opts.sectorIdOverride.trim()
          ? opts.sectorIdOverride.trim()
          : blogSectorFilter.trim();
      if (!sector) {
        setBlogs([]);
        if (!silent) setBlogsLoading(false);
        return;
      }
      if (!silent) setBlogsLoading(true);
      try {
        const sp = new URLSearchParams();
        sp.set('sectorId', sector);
        if (blogStatusFilter === 'published' || blogStatusFilter === 'draft') {
          sp.set('status', blogStatusFilter);
        }
        const qs = sp.toString();
        const res = await fetch(`/api/marketer/news?${qs}`);
        const d = res.ok ? await res.json().catch(() => ({})) : {};
        setBlogs((d?.items ?? []) as BlogListRow[]);
      } catch {
        if (!silent) setBlogs([]);
      } finally {
        if (!silent) setBlogsLoading(false);
      }
    },
    [blogSectorFilter, blogStatusFilter],
  );

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

  function cleanupLiveBlogPreview() {
    livePreviewBcRef.current?.close();
    livePreviewBcRef.current = null;
    setLivePreviewChannelId(null);
  }

  function closeBlogModal() {
    cleanupLiveBlogPreview();
    setBlogModalOpen(false);
    setEditingNewsSlug(null);
    setBlogForm(emptyBlogForm({ sectorId: blogSectorFilter }));
  }

  function openCreateBlogModal() {
    cleanupLiveBlogPreview();
    setBlogModalMode('create');
    setEditingNewsSlug(null);
    setBlogForm(emptyBlogForm({ sectorId: blogSectorFilter }));
    setBlogModalOpen(true);
  }

  async function openEditBlogModal(blog: BlogListRow) {
    cleanupLiveBlogPreview();
    setBlogModalMode('edit');
    setEditingNewsSlug(blog.slug);
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

  function postLiveBlogPreviewPayload(bc: BroadcastChannel, form: BlogFormState) {
    const raw = form.featuredImage?.trim() ?? '';
    const featured = raw ? normalizeBlogPreviewImage(form.featuredImage) ?? raw : null;
    const payload: BlogLivePreviewPayload = {
      title: form.title,
      content: form.content,
      featuredImage: featured,
      slug: form.slug.trim(),
    };
    bc.postMessage({ v: BLOG_LIVE_PREVIEW_MSG_V, payload });
  }

  function openLiveBlogPreview() {
    if (typeof window === 'undefined') return;
    livePreviewBcRef.current?.close();
    livePreviewBcRef.current = null;
    setLivePreviewChannelId(null);

    const ch =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

    const bc = new BroadcastChannel(blogLivePreviewChannelName(ch));
    livePreviewBcRef.current = bc;
    setLivePreviewChannelId(ch);

    const path = publicPathForLocale(locale, `preview/live?ch=${encodeURIComponent(ch)}`);
    const url = `${window.location.origin}${path}`;
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) {
      bc.close();
      livePreviewBcRef.current = null;
      setLivePreviewChannelId(null);
      setBlogToast({
        type: 'error',
        message: 'Pop-up blocked. Allow pop-ups for this site to open the live preview.',
      });
      return;
    }
    postLiveBlogPreviewPayload(bc, blogForm);
    window.setTimeout(() => postLiveBlogPreviewPayload(bc, blogForm), 50);
    window.setTimeout(() => postLiveBlogPreviewPayload(bc, blogForm), 400);
  }

  useEffect(() => {
    if (!blogModalOpen || !livePreviewChannelId) return;
    const bc = livePreviewBcRef.current;
    if (!bc) return;
    const id = window.setTimeout(() => {
      postLiveBlogPreviewPayload(bc, blogForm);
    }, 100);
    return () => window.clearTimeout(id);
  }, [blogForm, blogModalOpen, livePreviewChannelId]);

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
      ...marketerBlogFormApiPayload(blogForm),
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
      if (item.sectorId) {
        setBlogSectorFilter(item.sectorId);
      }
      const slim = blogListRowForState(item);
      setBlogs((prev) => {
        const rest = prev.filter((b) => b.id !== slim.id && b.slug !== slim.slug);
        return [slim, ...rest];
      });
      void refreshBlogs({ silent: true, sectorIdOverride: item.sectorId ?? null });
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
      ...marketerBlogFormApiPayload(blogForm),
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
        const slugNow = editingNewsSlug ?? blogForm.slug.trim();
        const verify = slugNow
          ? await fetch(`/api/marketer/news/${encodeURIComponent(slugNow)}`).then((r) =>
              r.ok ? r.json().catch(() => null) : null,
            )
          : null;
        const recovered = verify?.item as BlogListRow | undefined;
        if (recovered) {
          setBlogToast({
            type: 'success',
            message: 'Article saved (response body was incomplete; loaded from server).',
          });
          if (recovered.sectorId) setBlogSectorFilter(recovered.sectorId);
          const slim = blogListRowForState(recovered);
          setBlogs((prev) => {
            const idx = prev.findIndex((b) => b.slug === slim.slug || b.id === slim.id);
            if (idx === -1) return [slim, ...prev];
            const next = [...prev];
            next[idx] = { ...next[idx], ...slim };
            return next;
          });
          void refreshBlogs({ silent: true, sectorIdOverride: recovered.sectorId ?? null });
          closeBlogModal();
          return;
        }
        setBlogToast({
          type: 'error',
          message:
            'Save returned OK but no article payload — refresh the page and check the sector filter. If it persists, contact support.',
        });
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
      if (item.sectorId) {
        setBlogSectorFilter(item.sectorId);
      }
      setEditingNewsSlug(item.slug);
      setBlogForm(blogFromApiToForm(item, item.sectorId ?? blogSectorFilter));
      setBlogs((prev) => {
        const idx = prev.findIndex((b) => b.slug === priorSlug || b.id === slim.id);
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = { ...next[idx], ...slim, slug: slim.slug };
        return next;
      });
      void refreshBlogs({ silent: true, sectorIdOverride: item.sectorId ?? null });
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

  function requestSaveFromShortcut() {
    if (!blogModalOpen) return;
    if (blogModalMode === 'create') void createBlogPost(false);
    else void saveBlogPost(false);
  }

  useImperativeHandle(ref, () => ({
    requestSave: requestSaveFromShortcut,
    applyImageFromLibrary: (url: string) => {
      if (!blogModalOpen) return;
      setBlogForm((f) => ({ ...f, featuredImage: url }));
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
          <header className={`flex shrink-0 items-start justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 ${dashboardPanelHeaderClass}`}>
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
                  onClick={() => openLiveBlogPreview()}
                  disabled={blogActionLoading !== null}
                  className={`hidden disabled:opacity-50 sm:inline-flex ${dashboardHeaderActionSecondary} px-3 py-2 text-xs sm:text-sm`}
                >
                  Preview
                </button>
              </FeatureGate>
              <button
                type="button"
                onClick={closeBlogModal}
                className={dashboardIconButtonClass}
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
                if (featuredImageUploadInFlight.current) return;
                featuredImageUploadInFlight.current = true;
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
                  setBlogForm((f) => ({
                    ...f,
                    featuredImage: url,
                  }));
                  setImages((prev) => {
                    const row: StoredImageRow = {
                      id: data.id ?? data.key ?? `${Date.now()}`,
                      key: data.key ?? '',
                      url,
                      fileName: data.fileName ?? null,
                      altText: data.altText ?? null,
                      size: data.size ?? null,
                      updatedAt: new Date().toISOString(),
                    };
                    const k = row.key;
                    if (!k) return [row, ...prev];
                    return [row, ...prev.filter((x) => x.key !== k)];
                  });

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
                  featuredImageUploadInFlight.current = false;
                  setUploading(false);
                }
              }}
            />
            {blogForm.featuredImage ? (
              <div className="mt-4">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Featured preview
                </p>
                <div className={`flex max-h-[min(56vh,480px)] w-full items-center justify-center overflow-auto p-2 ${dashboardNestedCardClass}`}>
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
                ogImage={blogForm.featuredImage}
              />
              <BlogSeoScorePanel
                title={blogForm.title}
                slug={blogForm.slug}
                metaTitle={blogForm.metaTitle}
                metaDescription={blogForm.metaDescription}
                keywords={blogForm.keywords}
                focusKeyword={blogForm.focusKeyword}
                content={blogForm.content}
                ogImage={blogForm.featuredImage || null}
              />
            </div>
            <FeatureGate feature="previewSharing">
              <div className="mt-4 flex flex-col gap-2 sm:hidden">
                <button
                  type="button"
                  onClick={() => openLiveBlogPreview()}
                  disabled={blogActionLoading !== null}
                  className={`${dashboardHeaderActionSecondary} disabled:opacity-50`}
                >
                  Preview in new tab
                </button>
              </div>
            </FeatureGate>
          </div>

          <footer className="flex shrink-0 flex-col gap-3 border-t border-slate-200/60 bg-gradient-to-r from-slate-50/95 to-white px-4 py-3 backdrop-blur-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-950 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:px-6 sm:py-4">
            <button
              type="button"
              onClick={closeBlogModal}
              disabled={blogActionLoading !== null}
              className={`order-1 w-full disabled:opacity-50 sm:order-none sm:w-auto ${dashboardHeaderActionSecondary} px-5 py-2.5 text-sm font-semibold`}
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
              className={`order-3 w-full disabled:opacity-50 sm:order-none sm:w-auto sm:px-6 ${dashboardHeaderActionPrimary}`}
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
    <section className={dashboardPanelClass}>
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

      <div className={`flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-6 sm:px-8 ${dashboardPanelHeaderClass}`}>
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 dark:bg-indigo-500">
            <BookOpen size={22} strokeWidth={2} aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-950 dark:text-white sm:text-xl">
              Blogs
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Choose a <strong className="text-slate-800 dark:text-slate-200">sector</strong> (and optional{' '}
              <strong className="text-slate-800 dark:text-slate-200">status</strong>) to load posts for that division’s{' '}
              <span className="font-mono">/news/…</span> area. Then <strong className="text-slate-800 dark:text-slate-200">Create blog</strong> or{' '}
              <strong className="text-slate-800 dark:text-slate-200">Edit</strong> /{' '}
              <strong className="text-slate-800 dark:text-slate-200">Delete</strong> on each row.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreateBlogModal}
          className={`inline-flex shrink-0 items-center justify-center gap-2 ${dashboardHeaderActionPrimary}`}
        >
          <Plus size={18} strokeWidth={2.5} aria-hidden />
          Create blog
        </button>
      </div>

      <div className="flex flex-col gap-4 border-b border-slate-100/90 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4 sm:px-6">
        <div className="min-w-[10rem] flex-1 sm:max-w-xs">
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Sector
          </label>
          <select
            value={blogSectorFilter}
            onChange={(e) => setBlogSectorFilter(e.target.value)}
            className={`w-full cursor-pointer ${dashboardInputClass}`}
          >
            <option value="">Select sector…</option>
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
            className={`w-full cursor-pointer ${dashboardInputClass}`}
          >
            <option value="all">All statuses (this sector)</option>
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
              disabled={!blogListSectorSelected}
              className={`w-full py-2.5 pl-9 pr-3 disabled:cursor-not-allowed disabled:opacity-60 ${dashboardInputClass}`}
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
        ) : !blogListSectorSelected ? (
          <div className={`p-10 text-center text-sm text-slate-600 dark:text-slate-400 ${dashboardDashedFoldClass}`}>
            <p className="font-medium text-slate-800 dark:text-slate-200">No list loaded yet</p>
            <p className="mt-2">
              Select a <span className="font-semibold">sector</span> above. Optionally choose{' '}
              <span className="font-semibold">Published</span> or <span className="font-semibold">Draft</span> (or leave
              status on “all” for that sector). The table appears here so the page stays short.
            </p>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className={`p-10 text-center text-sm text-slate-600 dark:text-slate-400 ${dashboardDashedFoldClass}`}>
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
                <div className={`overflow-x-auto !p-0 ${dashboardNestedCardClass}`}>
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
                                className={`inline-flex items-center gap-1 py-1.5 text-xs font-semibold disabled:opacity-50 ${dashboardHeaderActionSecondary}`}
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
