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
  Eye,
  Upload,
} from 'lucide-react';
import { BRAND_LOGO_INTRINSIC, brandLogoSrc, brandLogoSrcSet } from '@/lib/brand-logo';
import { computeBlogSeoSummary } from '@/components/dashboard/BlogSeoScorePanel';
import FeatureGate from '@/components/FeatureGate';
import { MarketerBlogFields, type MarketerBlogFieldsHandle } from '@/components/dashboard/MarketerBlogFields';
import {
  blogFromApiToForm,
  emptyBlogForm,
  marketerBlogFormApiPayload,
  type BlogFormState,
  type BlogListRow,
} from '@/lib/marketer-blog-form';
import { pickCanonicalSectorRows } from '@/lib/company-divisions';
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
import { publicPathForLocale } from '@/lib/public-path-with-locale';
import {
  BLOG_LIVE_PREVIEW_MSG_V,
  blogLivePreviewChannelName,
  normalizeBlogPreviewImage,
  type BlogLivePreviewPayload,
} from '@/lib/blog-live-preview';
import MarketerAdSlotsModal from '@/components/dashboard/MarketerAdSlotsModal';
import MarketerAdCategoriesModal from '@/components/dashboard/MarketerAdCategoriesModal';

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
  const draftAutosaveAtRef = useRef(Date.now());
  const [autosaveLabelTick, setAutosaveLabelTick] = useState(0);
  const [adSlotsModalOpen, setAdSlotsModalOpen] = useState(false);
  const [adCategoriesModalOpen, setAdCategoriesModalOpen] = useState(false);
  const [adSlotCount, setAdSlotCount] = useState<number | null>(null);
  const [adCategoryCount, setAdCategoryCount] = useState<number | null>(null);
  const [domReady, setDomReady] = useState(false);
  const router = useRouter();

  const refreshAdSidebarStats = useCallback(async () => {
    try {
      const [r1, r2] = await Promise.all([
        fetch('/api/marketer/ad-slots', { credentials: 'include' }),
        fetch('/api/marketer/ad-categories', { credentials: 'include' }),
      ]);
      const d1 = r1.ok ? await r1.json().catch(() => ({})) : {};
      const d2 = r2.ok ? await r2.json().catch(() => ({})) : {};
      setAdSlotCount(Array.isArray(d1.items) ? d1.items.length : null);
      setAdCategoryCount(Array.isArray(d2.items) ? d2.items.length : null);
    } catch {
      setAdSlotCount(null);
      setAdCategoryCount(null);
    }
  }, []);

  useEffect(() => {
    setDomReady(true);
  }, []);

  useEffect(() => {
    if (!blogModalOpen) return;
    draftAutosaveAtRef.current = Date.now();
  }, [blogModalOpen]);

  useEffect(() => {
    if (!blogModalOpen) return;
    void refreshAdSidebarStats();
  }, [blogModalOpen, refreshAdSidebarStats]);

  useEffect(() => {
    if (!blogModalOpen) return;
    const id = window.setTimeout(() => {
      draftAutosaveAtRef.current = Date.now();
    }, 450);
    return () => window.clearTimeout(id);
  }, [blogForm, blogModalOpen]);

  useEffect(() => {
    if (!blogModalOpen) return;
    const id = window.setInterval(() => setAutosaveLabelTick((n) => n + 1), 3000);
    return () => window.clearInterval(id);
  }, [blogModalOpen]);

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

  const editorSeoSummary = useMemo(
    () =>
      computeBlogSeoSummary({
        title: blogForm.title,
        slug: blogForm.slug,
        metaTitle: blogForm.metaTitle,
        metaDescription: blogForm.metaDescription,
        keywords: blogForm.keywords,
        focusKeyword: blogForm.focusKeyword,
        content: blogForm.content,
        ogImage: blogForm.ogImage?.trim() || blogForm.featuredImage?.trim() || null,
      }),
    [
      blogForm.title,
      blogForm.slug,
      blogForm.metaTitle,
      blogForm.metaDescription,
      blogForm.keywords,
      blogForm.focusKeyword,
      blogForm.content,
      blogForm.ogImage,
      blogForm.featuredImage,
    ],
  );

  async function uploadStoredImage(file: File): Promise<string | null> {
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
      return null;
    }
    const url = data.url ?? '';
    if (url) {
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
    }
    return url || null;
  }

  function formatDraftAutosaveLabel(): string {
    void autosaveLabelTick;
    const sec = Math.floor((Date.now() - draftAutosaveAtRef.current) / 1000);
    if (sec < 5) return 'Auto-saved · just now';
    if (sec < 60) return `Auto-saved · ${sec}s ago`;
    const m = Math.floor(sec / 60);
    if (m < 60) return `Auto-saved · ${m}m ago`;
    return `Auto-saved · ${Math.floor(m / 60)}h ago`;
  }

  const blogEditorModal =
    blogModalOpen ? (
      <div
        className="fixed inset-0 z-[10000] m-0 flex h-[100dvh] w-screen max-w-none flex-col overflow-hidden p-0"
        role="dialog"
        aria-modal="true"
        aria-labelledby="blog-editor-title"
      >
        <div className="pointer-events-none absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]" aria-hidden />
        <div className="relative flex h-full w-full min-h-0 flex-1 flex-col overflow-hidden bg-slate-100 dark:bg-slate-950">
          <header
            className={`grid shrink-0 grid-cols-1 gap-3 border-b border-slate-200 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4 sm:px-6 sm:py-4 lg:grid-cols-[minmax(0,1.4fr)_auto_minmax(0,1fr)] ${dashboardPanelHeaderClass}`}
          >
            <div className="flex min-w-0 items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={brandLogoSrc(320)}
                srcSet={brandLogoSrcSet}
                sizes="120px"
                width={BRAND_LOGO_INTRINSIC.width}
                height={BRAND_LOGO_INTRINSIC.height}
                alt=""
                className="mt-0.5 h-9 w-auto max-w-[140px] shrink-0 object-contain sm:h-10"
              />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Doddapaneni Group
                </p>
                <h2
                  id="blog-editor-title"
                  className="text-base font-semibold tracking-tight text-slate-900 dark:text-white sm:text-lg"
                >
                  Content, SEO &amp; Media Dashboard
                </h2>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                  {sectorsLoading
                    ? 'Loading sectors…'
                    : 'Create, optimize and publish your content in one place.'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 justify-self-center lg:justify-self-auto">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                {formatDraftAutosaveLabel()}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 sm:justify-end lg:min-w-[11rem]">
              <div
                className={`inline-flex max-w-[14rem] items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs font-semibold sm:max-w-none ${
                  editorSeoSummary.tone === 'emerald'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/35 dark:text-emerald-100'
                    : editorSeoSummary.tone === 'amber'
                      ? 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/35 dark:text-amber-100'
                      : 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/35 dark:text-rose-100'
                }`}
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                <span className="leading-tight">
                  {editorSeoSummary.label === 'Good' ? 'Good · Well optimized!' : `${editorSeoSummary.label} · SEO score ${editorSeoSummary.score}`}
                </span>
              </div>
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

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-4 sm:px-6 sm:py-6 lg:min-w-0 lg:flex-[3]">
              <MarketerBlogFields
                ref={blogFieldsRef}
                blogForm={blogForm}
                setBlogForm={setBlogForm}
                sectors={sectors}
                sectorsLoading={sectorsLoading}
                authorLabel={authorLabel}
                uploading={uploading}
                locale={locale}
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
                    const url = await uploadStoredImage(file);
                    if (!url) return;
                    setBlogForm((f) => ({
                      ...f,
                      featuredImage: url,
                    }));

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
                              : 'Image stored, but updating the post failed. Use Publish to attach the URL.',
                        });
                      }
                    } else if (url) {
                      setBlogToast({
                        type: 'success',
                        message: 'Image saved as WebP in the library. Publish the post to attach it.',
                      });
                    }
                  } finally {
                    featuredImageUploadInFlight.current = false;
                    setUploading(false);
                  }
                }}
                onUploadOg={async (file: File) => {
                  if (featuredImageUploadInFlight.current) return;
                  featuredImageUploadInFlight.current = true;
                  setUploading(true);
                  try {
                    const url = await uploadStoredImage(file);
                    if (url) setBlogForm((f) => ({ ...f, ogImage: url }));
                  } finally {
                    featuredImageUploadInFlight.current = false;
                    setUploading(false);
                  }
                }}
                onUploadBanner={async (file: File) => {
                  if (featuredImageUploadInFlight.current) return;
                  featuredImageUploadInFlight.current = true;
                  setUploading(true);
                  try {
                    const url = await uploadStoredImage(file);
                    if (url) setBlogForm((f) => ({ ...f, bannerImage: url }));
                  } finally {
                    featuredImageUploadInFlight.current = false;
                    setUploading(false);
                  }
                }}
                onAppendGalleryImage={async (file: File) => {
                  if (featuredImageUploadInFlight.current) return;
                  featuredImageUploadInFlight.current = true;
                  setUploading(true);
                  try {
                    const url = await uploadStoredImage(file);
                    if (!url) return;
                    setBlogForm((f) => {
                      const parts = (f.galleryImageUrls ?? '')
                        .split(/[\n,]+/)
                        .map((s) => s.trim())
                        .filter(Boolean);
                      if (parts.length >= 8) return f;
                      return { ...f, galleryImageUrls: [...parts, url].slice(0, 8).join('\n') };
                    });
                  } finally {
                    featuredImageUploadInFlight.current = false;
                    setUploading(false);
                  }
                }}
              />
            </div>

            <aside className="hidden w-full max-w-none shrink-0 overflow-y-auto border-t border-slate-200 bg-slate-50/90 px-4 py-5 dark:border-slate-800 dark:bg-slate-900/50 lg:block lg:min-w-[min(20rem,26vw)] lg:max-w-md lg:flex-1 lg:border-l lg:border-t-0 xl:min-w-[22rem]">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Sidebar reference
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {[
                  {
                    label: 'Definitions',
                    value:
                      adSlotCount != null && adCategoryCount != null
                        ? String(adSlotCount + adCategoryCount)
                        : '—',
                    accent: 'bg-white dark:bg-slate-900',
                  },
                  {
                    label: 'Ad slots',
                    value: adSlotCount != null ? String(adSlotCount) : '—',
                    accent: 'bg-emerald-50 dark:bg-emerald-950/30',
                  },
                  {
                    label: 'Categories',
                    value: adCategoryCount != null ? String(adCategoryCount) : '—',
                    accent: 'bg-white dark:bg-slate-900',
                  },
                  {
                    label: 'Placements',
                    value: adSlotCount != null ? String(adSlotCount) : '—',
                    accent: 'bg-white dark:bg-slate-900',
                  },
                ].map((card) => (
                  <div
                    key={card.label}
                    className={`rounded-xl border border-slate-200 px-3 py-2.5 shadow-sm dark:border-slate-700 ${card.accent}`}
                  >
                    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {card.label}
                    </p>
                    <p className="mt-1 text-xl font-bold tabular-nums text-slate-900 dark:text-white">{card.value}</p>
                  </div>
                ))}
              </div>
              <div className={`mt-4 space-y-2 ${dashboardNestedCardClass}`}>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Ad sizes (reference)</p>
                <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                  <li className="flex justify-between gap-2">
                    <span>Leaderboard</span>
                    <span className="font-mono text-slate-500">728 × 90</span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span>Medium rectangle</span>
                    <span className="font-mono text-slate-500">300 × 250</span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span>Billboard</span>
                    <span className="font-mono text-slate-500">970 × 250</span>
                  </li>
                </ul>
                <button
                  type="button"
                  className="mt-2 w-full rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                  onClick={() => setAdSlotsModalOpen(true)}
                >
                  Manage ad slots
                </button>
              </div>
              <div className={`mt-4 ${dashboardNestedCardClass}`}>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Placement map</p>
                <div className="mt-2 space-y-1 rounded-lg border border-dashed border-slate-200 bg-white p-3 text-[10px] text-slate-500 dark:border-slate-600 dark:bg-slate-950/40 dark:text-slate-400">
                  <div className="rounded border border-slate-200 px-2 py-1 text-center dark:border-slate-600">Header top</div>
                  <div className="rounded border border-slate-200 px-2 py-3 text-center dark:border-slate-600">
                    Article body
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <div className="rounded border border-slate-200 py-2 text-center dark:border-slate-600">Sidebar</div>
                    <div className="col-span-2 rounded border border-slate-200 py-2 text-center dark:border-slate-600">
                      Below fold
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="mt-3 w-full rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                  onClick={() => setAdCategoriesModalOpen(true)}
                >
                  Manage category ads
                </button>
              </div>
              <div className={`mt-4 overflow-x-auto ${dashboardNestedCardClass}`}>
                <p className="mb-2 text-xs font-semibold text-slate-800 dark:text-slate-100">Recommended sizes</p>
                <table className="w-full text-left text-[11px] text-slate-600 dark:text-slate-400">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="pb-1.5 pr-2 font-semibold">Placement</th>
                      <th className="pb-1.5 font-semibold">Size</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr>
                      <td className="py-1.5">Header banner</td>
                      <td className="font-mono py-1.5">728 × 90</td>
                    </tr>
                    <tr>
                      <td className="py-1.5">In-content</td>
                      <td className="font-mono py-1.5">300 × 250</td>
                    </tr>
                    <tr>
                      <td className="py-1.5">Sidebar</td>
                      <td className="font-mono py-1.5">300 × 600</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </aside>
          </div>

          <footer className="flex shrink-0 flex-col gap-2 border-t border-slate-200/80 bg-white px-4 py-3 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-3 sm:px-6 sm:py-3">
            <FeatureGate feature="previewSharing">
              <button
                type="button"
                onClick={() => openLiveBlogPreview()}
                disabled={blogActionLoading !== null}
                className={`order-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 sm:order-none sm:w-auto`}
              >
                <Eye className="h-4 w-4" aria-hidden />
                Preview
              </button>
            </FeatureGate>
            <button
              type="button"
              onClick={() => void (blogModalMode === 'create' ? createBlogPost(true) : saveBlogPost(true))}
              disabled={
                blogActionLoading !== null ||
                (blogModalMode === 'create' &&
                  (!blogForm.sectorId.trim() ||
                    !blogForm.title.trim() ||
                    !blogForm.slug.trim() ||
                    !blogForm.content.trim()))
              }
              className="order-1 w-full rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 sm:order-none sm:w-auto"
            >
              {blogActionLoading === 'draft' ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Saving draft…
                </span>
              ) : (
                'Save draft'
              )}
            </button>
            <button
              type="button"
              onClick={() => void (blogModalMode === 'create' ? createBlogPost(false) : saveBlogPost(false))}
              disabled={
                blogActionLoading !== null ||
                (blogModalMode === 'create' &&
                  (!blogForm.sectorId.trim() ||
                    !blogForm.title.trim() ||
                    !blogForm.slug.trim() ||
                    !blogForm.content.trim()))
              }
              className="order-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#3b82f6] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600 disabled:opacity-50 sm:order-none sm:w-auto"
            >
              {blogActionLoading === 'save' || blogActionLoading === 'create' ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Publishing…
                </span>
              ) : (
                <>
                  <Upload className="h-4 w-4" aria-hidden />
                  Publish
                </>
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
    <MarketerAdSlotsModal
      open={adSlotsModalOpen}
      onClose={() => setAdSlotsModalOpen(false)}
      onSaved={() => {
        void refreshAdSidebarStats();
      }}
    />
    <MarketerAdCategoriesModal
      open={adCategoriesModalOpen}
      onClose={() => setAdCategoriesModalOpen(false)}
      onSaved={() => {
        void refreshAdSidebarStats();
      }}
    />
    </>
  );
});

export default MarketerBlogsManager;
