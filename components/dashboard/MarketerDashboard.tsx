'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
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
  BarChart3,
  Users,
  BookOpen,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import VisitStatsLazy from './VisitStatsLazy';
import MyActivityPanel from './MyActivityPanel';
import { useDashboardShortcuts } from '@/components/dashboard/DashboardShortcutsProvider';
import type { Role } from '@/lib/constants';
import { getDashboardTitle } from '@/lib/dashboard-title';
import { pickCanonicalSectorRows } from '@/lib/company-divisions';
import FeatureGate from '@/components/FeatureGate';
import DashboardPageHeader from './DashboardPageHeader';
import { MarketerBlogFields, type MarketerBlogFieldsHandle } from '@/components/dashboard/MarketerBlogFields';
import {
  blogFromApiToForm,
  emptyBlogForm,
  type BlogFormState,
  type BlogListRow,
} from '@/lib/marketer-blog-form';
import CareersJobsPanel from './CareersJobsPanel';
import { publicPathForLocale, publicPathWithLocale } from '@/lib/public-path-with-locale';
import { getSiteOrigin } from '@/lib/site-origin';
import { hasDeveloperAccess } from '@/lib/role-utils';

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
  status: 'draft' | 'published';
  scheduledPublishAt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  keywords: string | null;
  canonicalUrl: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
};

type SectorRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
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
  ogImage,
}: {
  title: string;
  description: string;
  url: string;
  ogImage?: string | null;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Google preview
      </p>
      <p className="truncate text-sm text-emerald-700 dark:text-emerald-400">{url || 'https://example.com/page-url'}</p>
      <p className="truncate text-[18px] leading-6 text-blue-700 hover:underline dark:text-blue-400">
        {title || 'Your page title appears here'}
      </p>
      <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
        {description || 'Your meta description appears here for search users.'}
      </p>
      {ogImage ? (
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ogImage} alt="OG preview" className="h-28 w-full bg-slate-100 object-cover dark:bg-slate-800" />
        </div>
      ) : null}
    </div>
  );
}

function toDateTimeLocalValue(v: string | null | undefined) {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}

function stripHtmlToText(value: string | null | undefined) {
  const s = (value ?? '').toString();
  // Very lightweight HTML->text conversion for length scoring.
  return s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

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

type SeoScoreResult = {
  score: number;
  warnings: { id: string; label: string }[];
};

type SeoSuggestionsResult = {
  suggestedKeywordsCsv: string;
  suggestedMetaDescription: string;
  hasH1: boolean;
  hasH2: boolean;
  keywordTokens: string[];
};

function computeSeoScore(args: {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  content: string;
}): SeoScoreResult {
  const metaTitle = (args.metaTitle ?? '').trim();
  const metaDescription = (args.metaDescription ?? '').trim();
  const keywordsRaw = (args.keywords ?? '').trim();
  const contentText = stripHtmlToText(args.content);

  const titleLen = metaTitle.length;
  const descLen = metaDescription.length;
  const keywordTokens = keywordsRaw
    ? keywordsRaw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];
  const keywordCount = keywordTokens.length;
  const contentLen = contentText.length;

  // Simple, fast scoring heuristic:
  // - Title: ideal 40-60 chars (0-30 points)
  // - Description: ideal 120-160 chars (0-40 points)
  // - Keywords presence: 1+ token (0-10 points)
  // - Content length: best at >=1200 chars (0-20 points)
  const titleIdealMin = 40;
  const titleIdealMax = 60;
  const descIdealMin = 120;
  const descIdealMax = 160;
  const contentIdeal = 1200;

  const titleScore = (() => {
    if (!titleLen) return 0;
    if (titleLen >= titleIdealMin && titleLen <= titleIdealMax) return 30;
    if (titleLen < titleIdealMin) return Math.round((titleLen / titleIdealMin) * 30);
    const over = titleLen - titleIdealMax;
    const penalty = (over / titleIdealMax) * 30;
    return Math.round(clamp(30 - penalty, 0, 30));
  })();

  const descScore = (() => {
    if (!descLen) return 0;
    if (descLen >= descIdealMin && descLen <= descIdealMax) return 40;
    if (descLen < descIdealMin) return Math.round((descLen / descIdealMin) * 40);
    const over = descLen - descIdealMax;
    const penalty = (over / descIdealMax) * 40;
    return Math.round(clamp(40 - penalty, 0, 40));
  })();

  const keywordsScore = keywordCount > 0 ? 10 : 0;
  const contentScore = contentLen > 0 ? Math.round(clamp((contentLen / contentIdeal) * 20, 0, 20)) : 0;

  const score = clamp(titleScore + descScore + keywordsScore + contentScore, 0, 100);

  const warnings: { id: string; label: string }[] = [];
  if (keywordCount === 0) warnings.push({ id: 'missing_keywords', label: 'Missing keywords' });
  if (descLen === 0) warnings.push({ id: 'missing_description', label: 'Missing meta description' });
  if (titleLen > 0 && titleLen < 30) warnings.push({ id: 'title_too_short', label: 'Title is too short (aim 40-60 chars)' });
  if (titleLen > 60) warnings.push({ id: 'title_too_long', label: 'Title is too long (aim 40-60 chars)' });

  return { score, warnings };
}

function SeoScorePanel(props: {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  content: string;
}) {
  const result = useMemo(
    () => computeSeoScore({ metaTitle: props.metaTitle, metaDescription: props.metaDescription, keywords: props.keywords, content: props.content }),
    [props.metaTitle, props.metaDescription, props.keywords, props.content]
  );

  const tone = result.score >= 80 ? 'emerald' : result.score >= 55 ? 'amber' : 'rose';
  const toneTitleClass =
    tone === 'emerald' ? 'text-emerald-700' : tone === 'amber' ? 'text-amber-700' : 'text-rose-700';
  const toneBarClass =
    tone === 'emerald' ? 'bg-emerald-600' : tone === 'amber' ? 'bg-amber-600' : 'bg-rose-600';

  return (
    <div className={`rounded-xl border bg-white p-4 mt-1 border-slate-200`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-slate-500">SEO score</p>
          <p className={`text-sm font-semibold ${toneTitleClass}`}>Meta + content readiness</p>
        </div>
        <div className="text-right">
          <p className={`text-3xl font-bold leading-none ${toneTitleClass}`}>{result.score}</p>
          <p className="text-xs text-slate-500">/ 100</p>
        </div>
      </div>
      <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${toneBarClass}`}
          style={{ width: `${result.score}%` }}
        />
      </div>

      {result.warnings.length > 0 ? (
        <div className="mt-3 space-y-1">
          <p className="text-xs font-medium text-slate-700">Suggestions</p>
          {result.warnings.map((w) => (
            <p key={w.id} className="text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-md px-2 py-1">
              - {w.label}
            </p>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-2 py-1">
          Looks good. No blocking issues detected.
        </p>
      )}
    </div>
  );
}

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'has',
  'he',
  'in',
  'is',
  'it',
  'its',
  'of',
  'on',
  'or',
  'that',
  'the',
  'their',
  'this',
  'to',
  'was',
  'were',
  'will',
  'with',
  'you',
  'your',
]);

function tokeniseForKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  const tokens = lower.match(/[a-z0-9]+/g) ?? [];
  return tokens.filter((t) => t.length >= 3 && !STOP_WORDS.has(t));
}

function suggestKeywordsFromContent(contentHtml: string): SeoSuggestionsResult['keywordTokens'] {
  const plain = stripHtmlToText(contentHtml);
  const tokens = tokeniseForKeywords(plain);
  const freq = new Map<string, number>();
  for (const t of tokens) freq.set(t, (freq.get(t) ?? 0) + 1);

  // Lightweight: top tokens only (no heavy NLP).
  const sorted = Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([t]) => t);

  // De-dup & limit.
  return sorted.slice(0, 8);
}

function suggestMetaDescriptionFromContent(contentHtml: string): string {
  const plain = stripHtmlToText(contentHtml);
  if (!plain) return '';

  // Prefer first sentence-like chunk if possible.
  const sentenceEnd = plain.search(/[.!?]/);
  const base =
    sentenceEnd > 20 ? plain.slice(0, sentenceEnd + 1).trim() : plain.slice(0, 200).trim();

  // Normalize whitespace.
  const cleaned = base.replace(/\s+/g, ' ');
  if (cleaned.length <= 160) return cleaned;
  return cleaned.slice(0, 157).trimEnd().replace(/[,:;]\s*$/, '') + '…';
}

function computeSeoSuggestions(args: {
  contentHtml: string;
  currentKeywordsCsv: string;
  currentMetaDescription: string;
}): SeoSuggestionsResult {
  const keywordTokens = suggestKeywordsFromContent(args.contentHtml);
  const suggestedKeywordsCsv = keywordTokens.join(', ');
  const suggestedMetaDescription = suggestMetaDescriptionFromContent(args.contentHtml);
  const hasH1 = /<h1\b/i.test(args.contentHtml);
  const hasH2 = /<h2\b/i.test(args.contentHtml);
  return {
    suggestedKeywordsCsv,
    suggestedMetaDescription,
    hasH1,
    hasH2,
    keywordTokens,
  };
}

function SeoImprovementsPanel(props: {
  content: string;
  keywordsCsv: string;
  metaDescription: string;
  onCopyKeywords: () => void;
  onCopyMetaDescription: () => void;
}) {
  const result = useMemo(
    () =>
      computeSeoSuggestions({
        contentHtml: props.content,
        currentKeywordsCsv: props.keywordsCsv,
        currentMetaDescription: props.metaDescription,
      }),
    [props.content, props.keywordsCsv, props.metaDescription]
  );

  const hasKeywords = props.keywordsCsv.trim().length > 0;
  const descLen = (props.metaDescription ?? '').trim().length;

  return (
    <details className="mt-3">
      <summary className="cursor-pointer list-none flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
        <span className="text-sm font-semibold text-slate-800">SEO improvement suggestions</span>
        <span className="text-xs text-slate-500">Non-destructive</span>
      </summary>

      <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3 space-y-3">
        <div>
          <p className="text-xs font-medium text-slate-700 mb-1">Keywords</p>
          {!hasKeywords ? (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2 py-1 w-fit">
              Missing keywords
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-2">
            {(result.keywordTokens.length ? result.keywordTokens : ['keyword']).map((kw) => (
              <span
                key={kw}
                className="text-[11px] px-2 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700"
              >
                {kw}
              </span>
            ))}
          </div>
          <div className="mt-2 flex gap-2 flex-wrap items-center">
            <button
              type="button"
              onClick={props.onCopyKeywords}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs hover:bg-slate-50"
              disabled={!result.suggestedKeywordsCsv}
            >
              Copy suggested keywords
            </button>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-slate-700 mb-1">Meta description</p>
          {descLen === 0 ? (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2 py-1 w-fit">
              Missing description
            </p>
          ) : null}
          {result.suggestedMetaDescription ? (
            <p className="text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2 mt-2">
              Suggested: {result.suggestedMetaDescription}
            </p>
          ) : (
            <p className="text-xs text-slate-500 mt-2">Add content to generate a suggestion.</p>
          )}
          <div className="mt-2 flex gap-2 flex-wrap items-center">
            <button
              type="button"
              onClick={props.onCopyMetaDescription}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs hover:bg-slate-50"
              disabled={!result.suggestedMetaDescription}
            >
              Copy suggested description
            </button>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-slate-700 mb-1">Headings (H1 / H2)</p>
          <div className="flex gap-2 flex-wrap">
            <span
              className={`text-[11px] px-2 py-1 rounded-md border ${
                result.hasH1 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
              }`}
            >
              {result.hasH1 ? 'H1 found' : 'Missing H1'}
            </span>
            <span
              className={`text-[11px] px-2 py-1 rounded-md border ${
                result.hasH2 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
              }`}
            >
              {result.hasH2 ? 'H2 found' : 'Missing H2'}
            </span>
          </div>
          {(!result.hasH1 || !result.hasH2) && (
            <p className="text-xs text-slate-600 mt-2">
              Suggestion: add an <code>{"<h1>"}</code> near the top (usually the page/blog title) and use <code>{"<h2>"}</code> for major sections.
            </p>
          )}
        </div>
      </div>
    </details>
  );
}

export default function MarketerDashboard({
  locale,
  viewerRole,
  canPages,
  canBlogs,
}: {
  locale: string;
  viewerRole: Role;
  canPages: boolean;
  canBlogs: boolean;
}) {
  const base = publicPathForLocale(locale, '/');
  const { data: sessionData } = useSession();
  const { pushSaveLayer } = useDashboardShortcuts();
  const authorLabel = sessionData?.user?.email ?? sessionData?.user?.name ?? '—';
  const [activeTab, setActiveTab] = useState<'campaigns' | 'links' | 'pages' | 'blogs'>(() =>
    canPages ? 'pages' : canBlogs ? 'blogs' : 'campaigns',
  );

  useEffect(() => {
    if (canPages) return;
    setActiveTab((t) => (t === 'pages' ? (canBlogs ? 'blogs' : 'campaigns') : t));
  }, [canPages, canBlogs]);

  useEffect(() => {
    if (canBlogs) return;
    setActiveTab((t) => (t === 'blogs' ? (canPages ? 'pages' : 'campaigns') : t));
  }, [canBlogs, canPages]);

  const [previewLink, setPreviewLink] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

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
  const [creatingPage, setCreatingPage] = useState(false);
  const PAGE_KEY_OPTIONS: { value: string; label: string }[] = [
    { value: 'home', label: 'Home' },
    { value: 'about', label: 'About' },
    { value: 'contact', label: 'Contact' },
  ];
  const [pageForm, setPageForm] = useState({
    pageKey: '',
    title: '',
    slug: '',
    body: '',
    status: 'published' as 'draft' | 'published',
    scheduledPublishAt: '',
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
  const [blogs, setBlogs] = useState<BlogListRow[]>([]);
  const [blogsLoading, setBlogsLoading] = useState(true);
  const [sectors, setSectors] = useState<SectorRow[]>([]);
  const [sectorsLoading, setSectorsLoading] = useState(true);
  const [blogSectorFilter, setBlogSectorFilter] = useState('');
  const [selectedBlogSlug, setSelectedBlogSlug] = useState('');
  const [blogForm, setBlogForm] = useState<BlogFormState>(() => emptyBlogForm());
  const blogFieldsRef = useRef<MarketerBlogFieldsHandle>(null);
  const [blogListSearch, setBlogListSearch] = useState('');
  const [blogToast, setBlogToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [blogLoadingSlug, setBlogLoadingSlug] = useState<string | null>(null);
  const [blogActionLoading, setBlogActionLoading] = useState<'save' | 'create' | 'delete' | null>(null);

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

  useEffect(() => {
    if (!blogToast) return;
    const t = window.setTimeout(() => setBlogToast(null), 5200);
    return () => window.clearTimeout(t);
  }, [blogToast]);

  // ——— Stored media picker ———
  const [images, setImages] = useState<StoredImageRow[]>([]);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [imageSearch, setImageSearch] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Clear preview link when switching contexts.
    setPreviewLink(null);
  }, [activeTab, selectedPageSlug, selectedBlogSlug]);

  useEffect(() => {
    if (!canPages) {
      setPages([]);
      setPagesLoading(false);
      return;
    }
    fetch(`/api/marketer/page-content?locale=${encodeURIComponent(locale)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const items = (d?.items ?? []) as PageContentRow[];
        setPages(items);
        if (items[0]) selectPage(items[0]);
      })
      .catch(() => setPages([]))
      .finally(() => setPagesLoading(false));
  }, [locale, canPages]);

  useEffect(() => {
    if (!canBlogs) {
      setBlogs([]);
      setBlogsLoading(false);
      return;
    }
    const qs = blogSectorFilter
      ? `?sectorId=${encodeURIComponent(blogSectorFilter)}`
      : '';
    fetch(`/api/marketer/news${qs}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const items = (d?.items ?? []) as BlogListRow[];
        setBlogs(items);
        if (items[0]) {
          void selectBlog(items[0]);
        } else {
          setSelectedBlogSlug('');
          setBlogForm(emptyBlogForm({ sectorId: blogSectorFilter }));
        }
      })
      .catch(() => setBlogs([]))
      .finally(() => setBlogsLoading(false));
  }, [blogSectorFilter, canBlogs]);

  useEffect(() => {
    fetch('/api/marketer/sectors')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setSectors(pickCanonicalSectorRows((d?.items ?? []) as SectorRow[])))
      .catch(() => setSectors([]))
      .finally(() => setSectorsLoading(false));
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
    setCreatingPage(false);
    setPageForm({
      pageKey: page.pageKey ?? '',
      title: page.title ?? '',
      slug: page.slug ?? '',
      body: page.body ?? '',
      status: page.status ?? 'published',
      scheduledPublishAt: toDateTimeLocalValue(page.scheduledPublishAt),
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

  function startNewBlogPost() {
    setSelectedBlogSlug('');
    setBlogForm(emptyBlogForm({ sectorId: blogSectorFilter }));
  }

  async function selectBlog(blog: BlogListRow) {
    setSelectedBlogSlug(blog.slug);
    if (typeof blog.content === 'string') {
      setBlogForm(blogFromApiToForm(blog, blog.sectorId ?? blogSectorFilter));
      return;
    }
    setBlogLoadingSlug(blog.slug);
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
      setBlogs((prev) => prev.map((b) => (b.id === item.id ? { ...b, ...item } : b)));
      setBlogForm(blogFromApiToForm(item, item.sectorId ?? blogSectorFilter));
    } catch {
      setBlogForm(blogFromApiToForm(blog, blog.sectorId ?? blogSectorFilter));
      setBlogToast({ type: 'error', message: 'Network error while loading the post.' });
    } finally {
      setBlogLoadingSlug(null);
    }
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
    setSelectedPageSlug(item.slug);
    setPageForm((f) => ({
      ...f,
      pageKey: item.pageKey,
      slug: item.slug,
      title: item.title,
      body: item.body,
      status: item.status,
      scheduledPublishAt: toDateTimeLocalValue(item.scheduledPublishAt),
      metaTitle: item.metaTitle ?? '',
      metaDescription: item.metaDescription ?? '',
      keywords: item.keywords ?? '',
      canonicalUrl: item.canonicalUrl ?? '',
      ogTitle: item.ogTitle ?? '',
      ogDescription: item.ogDescription ?? '',
      ogImage: item.ogImage ?? '',
      seoNote: '',
    }));
  }

  async function createPage() {
    // Marketer can create new PageContent rows; only PageKeys below are wired to the public site.
    const payload = {
      pageKey: pageForm.pageKey.trim(),
      slug: pageForm.slug.trim(),
      locale,
      title: pageForm.title.trim(),
      body: pageForm.body,
      status: pageForm.status,
      scheduledPublishAt: pageForm.scheduledPublishAt || null,
      metaTitle: pageForm.metaTitle.trim() || null,
      metaDescription: pageForm.metaDescription.trim() || null,
      keywords: pageForm.keywords.trim() || null,
      canonicalUrl: pageForm.canonicalUrl.trim() || null,
      ogTitle: pageForm.ogTitle.trim() || null,
      ogDescription: pageForm.ogDescription.trim() || null,
      ogImage: pageForm.ogImage.trim() || null,
      seoNote: pageForm.seoNote.trim() || undefined,
    };

    if (!payload.pageKey || !payload.slug || !payload.title) return;

    const res = await fetch('/api/marketer/page-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return;

    const item = data.item as PageContentRow;
    setPages((prev) => [item, ...prev]);
    setSelectedPageSlug(item.slug);
    setCreatingPage(false);
    setPageForm({
      pageKey: item.pageKey,
      title: item.title,
      slug: item.slug,
      body: item.body,
      status: item.status,
      scheduledPublishAt: toDateTimeLocalValue(item.scheduledPublishAt),
      seoNote: '',
      metaTitle: item.metaTitle ?? '',
      metaDescription: item.metaDescription ?? '',
      keywords: item.keywords ?? '',
      canonicalUrl: item.canonicalUrl ?? '',
      ogTitle: item.ogTitle ?? '',
      ogDescription: item.ogDescription ?? '',
      ogImage: item.ogImage ?? '',
    });
  }

  async function deleteSelectedPage() {
    if (!selectedPageSlug) return;
    if (!confirm('Delete this page content?')) return;

    const res = await fetch(`/api/marketer/page-content/${encodeURIComponent(selectedPageSlug)}`, {
      method: 'DELETE',
    });
    if (!res.ok) return;

    const remaining = pages.filter((p) => p.slug !== selectedPageSlug);
    setPages(remaining);
    setSelectedPageSlug('');
    setCreatingPage(false);
    setPageForm({
      pageKey: PAGE_KEY_OPTIONS[0]?.value ?? 'home',
      title: '',
      slug: '',
      body: '',
      status: 'published',
      scheduledPublishAt: '',
      seoNote: '',
      metaTitle: '',
      metaDescription: '',
      keywords: '',
      canonicalUrl: '',
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
    });
  }

  async function saveBlogSeo() {
    if (!selectedBlogSlug) {
      setBlogToast({
        type: 'error',
        message: 'Select a post from the list, or use “New post” to create one.',
      });
      return;
    }
    const patches =
      typeof blogFieldsRef.current?.getTranslationPatches === 'function'
        ? blogFieldsRef.current.getTranslationPatches()
        : [];
    const payload: Record<string, unknown> = {
      ...blogForm,
      featuredImage: blogForm.featuredImage || null,
      translationPatches: patches,
    };
    setBlogActionLoading('save');
    try {
      const res = await fetch(`/api/marketer/news/${encodeURIComponent(selectedBlogSlug)}`, {
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
        setBlogToast({
          type: 'error',
          message: formatBlogApiError(
            data,
            `Save failed (${res.status}). Check scheduling or feature flags.`,
          ),
        });
        return;
      }
      if (!data.item) {
        setBlogToast({ type: 'error', message: 'Save returned no data. Try again.' });
        return;
      }
      const item = data.item;
      setBlogs((prev) => prev.map((b) => (b.id === item.id ? { ...b, ...item } : b)));
      setSelectedBlogSlug(item.slug);
      setBlogForm(blogFromApiToForm(item, item.sectorId ?? blogSectorFilter));
      setBlogToast({ type: 'success', message: 'Changes saved to the database.' });
    } catch {
      setBlogToast({ type: 'error', message: 'Save failed (network or server error).' });
    } finally {
      setBlogActionLoading(null);
    }
  }

  async function deleteSelectedBlog() {
    if (!selectedBlogSlug) return;
    if (!confirm('Delete this blog from the database? This cannot be undone.')) return;

    setBlogActionLoading('delete');
    try {
      const res = await fetch(`/api/marketer/news/${encodeURIComponent(selectedBlogSlug)}`, {
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

      const remaining = blogs.filter((b) => b.slug !== selectedBlogSlug);
      setBlogs(remaining);
      setBlogToast({ type: 'success', message: 'Blog removed from the database.' });

      if (remaining[0]) void selectBlog(remaining[0]);
      else {
        setSelectedBlogSlug('');
        setBlogForm(emptyBlogForm({ sectorId: blogSectorFilter }));
      }
    } catch {
      setBlogToast({ type: 'error', message: 'Delete failed (network error).' });
    } finally {
      setBlogActionLoading(null);
    }
  }

  async function createBlog() {
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
    setBlogActionLoading('create');
    try {
      const res = await fetch('/api/marketer/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blogForm),
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
      setBlogs((prev) => [item, ...prev]);
      void selectBlog(item);
      setBlogToast({ type: 'success', message: 'New blog created and stored in the database.' });
    } catch {
      setBlogToast({ type: 'error', message: 'Create failed (network or server error).' });
    } finally {
      setBlogActionLoading(null);
    }
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

  async function copyImageUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard may be blocked; users can still manually copy from the preview.
      alert('Copy failed. Please copy the URL manually.');
    }
  }

  async function copyTextToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      alert('Copy failed. Please copy manually.');
    }
  }

  async function createPreviewLink(kind: "page" | "blog") {
    setPreviewLoading(true);
    setPreviewLink(null);
    try {
      const slug =
        kind === 'page'
          ? selectedPageSlug.trim()
          : (selectedBlogSlug || blogForm.slug.trim());
      const payload = { kind, slug, locale };

      if (!slug) {
        alert(
          kind === 'page'
            ? 'Select or create a page first.'
            : 'Select a post from the list or enter a slug in the form, then try preview again.',
        );
        return;
      }

      const res = await fetch("/api/preview/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data?.message ?? "Failed to create preview link");
        return;
      }

      if (data?.url) {
        setPreviewLink(data.url);
      }
    } catch {
      alert("Failed to create preview link");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function deleteImage(key: string) {
    if (!confirm('Delete this image?')) return;
    const res = await fetch(`/api/marketer/stored-image/${encodeURIComponent(key)}`, { method: 'DELETE' });
    if (!res.ok) return;
    setImages((prev) => prev.filter((i) => i.key !== key));
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

  const marketerSaveRef = useRef<() => void>(() => {});
  marketerSaveRef.current = () => {
    if (activeTab === 'pages' && canPages) {
      if (creatingPage) void createPage();
      else if (selectedPageSlug) void savePageSeo();
    } else if (activeTab === 'blogs' && canBlogs) {
      if (selectedBlogSlug) void saveBlogSeo();
    } else if (activeTab === 'campaigns' && showCampaignForm) {
      void handleSaveCampaign();
    } else if (activeTab === 'links' && showLinkForm) {
      void handleSaveLink();
    }
  };

  useEffect(() => {
    return pushSaveLayer(() => {
      marketerSaveRef.current();
    });
  }, [pushSaveLayer]);

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        icon={Megaphone}
        title={getDashboardTitle(viewerRole)}
        description="Pages, blogs, campaigns, and media for your locale. Admins and digital marketers use this area; all data is stored in the database."
      />

      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.07)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/25">
        <h2 className="flex items-center gap-3 border-b border-slate-100/95 bg-gradient-to-r from-slate-50/98 to-white p-5 text-lg font-semibold text-slate-800 dark:border-slate-800 dark:from-slate-800/45 dark:to-slate-900/85 dark:text-slate-100">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white dark:bg-blue-500">
            <Globe size={18} aria-hidden />
          </span>
          Quick links
        </h2>
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href={base}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all hover:border-blue-200/80 hover:shadow-md dark:border-slate-600 dark:bg-slate-800/40 dark:hover:border-blue-500/40"
          >
            <Globe size={22} className="shrink-0 text-blue-700 dark:text-blue-400" />
            <span className="font-medium text-slate-800 dark:text-slate-100">View site</span>
          </Link>
          <Link
            href={publicPathWithLocale(locale, 'contact')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all hover:border-blue-200/80 hover:shadow-md dark:border-slate-600 dark:bg-slate-800/40 dark:hover:border-blue-500/40"
          >
            <Mail size={22} className="shrink-0 text-blue-700 dark:text-blue-400" />
            <span className="font-medium text-slate-800 dark:text-slate-100">Contact page</span>
          </Link>
          <Link
            href={publicPathWithLocale(locale, 'team')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all hover:border-blue-200/80 hover:shadow-md dark:border-slate-600 dark:bg-slate-800/40 dark:hover:border-blue-500/40"
          >
            <Users size={22} className="shrink-0 text-blue-700 dark:text-blue-400" />
            <span className="font-medium text-slate-800 dark:text-slate-100">Team page</span>
          </Link>
          <Link
            href={publicPathWithLocale(locale, 'careers')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all hover:border-blue-200/80 hover:shadow-md dark:border-slate-600 dark:bg-slate-800/40 dark:hover:border-blue-500/40"
          >
            <Target size={22} className="shrink-0 text-blue-700 dark:text-blue-400" />
            <span className="font-medium text-slate-800 dark:text-slate-100">Careers page</span>
          </Link>
          <Link
            href={publicPathForLocale(locale, '/dashboard/analytics')}
            className="flex items-center gap-3 rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all hover:border-violet-200/80 hover:shadow-md dark:border-slate-600 dark:bg-slate-800/40 dark:hover:border-violet-500/40"
          >
            <BarChart3 size={22} className="shrink-0 text-violet-600 dark:text-violet-400" />
            <span className="font-medium text-slate-800 dark:text-slate-100">Analytics</span>
          </Link>
        </div>
      </section>

      <VisitStatsLazy />

      {canPages && hasDeveloperAccess(viewerRole) ? <CareersJobsPanel locale={locale} /> : null}

      <section className="rounded-2xl border border-slate-200/90 bg-slate-100/80 p-1.5 shadow-inner dark:border-slate-700/80 dark:bg-slate-950/60">
        <div className="flex flex-wrap gap-1">
          {[
            ...(canPages ? [{ id: 'pages', label: 'Pages' }] : []),
            ...(canBlogs ? [{ id: 'blogs', label: 'Blogs' }] : []),
            { id: 'campaigns', label: 'Campaigns' },
            { id: 'links', label: 'Tools' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-md ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-white dark:ring-slate-600'
                  : 'text-slate-600 hover:bg-white/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {activeTab === 'pages' && canPages && (
        <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.07)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/25">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100/95 bg-gradient-to-r from-slate-50/98 to-white p-5 dark:border-slate-800 dark:from-slate-800/45 dark:to-slate-900/85">
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Pages management + SEO</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Select a page, update content, then save.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCreatingPage(true);
                setSelectedPageSlug('');
                setPageForm({
                  pageKey: PAGE_KEY_OPTIONS[0]?.value ?? 'home',
                  title: '',
                  slug: '',
                  body: '',
                  status: 'draft',
                  scheduledPublishAt: '',
                  seoNote: '',
                  metaTitle: '',
                  metaDescription: '',
                  keywords: '',
                  canonicalUrl: '',
                  ogTitle: '',
                  ogDescription: '',
                  ogImage: '',
                });
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 text-white text-sm font-medium hover:bg-slate-800"
            >
              <Plus size={18} />
              Create page
            </button>
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
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs bg-slate-200 text-slate-700">
                        {p.status}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="lg:col-span-2 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <select
                  value={pageForm.pageKey}
                  onChange={(e) => setPageForm((f) => ({ ...f, pageKey: e.target.value }))}
                  disabled={!creatingPage}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {PAGE_KEY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <input
                  value={pageForm.slug}
                  onChange={(e) => setPageForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="Slug (URL)"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <select
                  value={pageForm.status}
                  onChange={(e) => setPageForm((f) => ({ ...f, status: e.target.value as 'draft' | 'published' }))}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <FeatureGate feature="scheduling">
                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    type="datetime-local"
                    value={pageForm.scheduledPublishAt}
                    onChange={(e) => setPageForm((f) => ({ ...f, scheduledPublishAt: e.target.value }))}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
                  />
                  <p className="text-xs text-slate-500 sm:col-span-2 -mt-2">
                    Optional: pick a publish date/time. If set to a future time, it will be hidden publicly until due.
                  </p>
                </div>
              </FeatureGate>
              <input
                value={pageForm.title}
                onChange={(e) => setPageForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Page title"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <textarea
                value={pageForm.body}
                onChange={(e) => setPageForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="Page content (rich text / HTML)"
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
                url={
                  pageForm.canonicalUrl ||
                  `${getSiteOrigin().replace(/\/$/, '')}${publicPathWithLocale(locale, selectedPageSlug || '')}`
                }
                ogImage={pageForm.ogImage}
              />
              <FeatureGate feature="seoScore">
                <SeoScorePanel
                  metaTitle={pageForm.metaTitle}
                  metaDescription={pageForm.metaDescription}
                  keywords={pageForm.keywords}
                  content={pageForm.body}
                />
                <SeoImprovementsPanel
                  content={pageForm.body}
                  keywordsCsv={pageForm.keywords}
                  metaDescription={pageForm.metaDescription}
                  onCopyKeywords={() => {
                    const res = computeSeoSuggestions({
                      contentHtml: pageForm.body,
                      currentKeywordsCsv: pageForm.keywords,
                      currentMetaDescription: pageForm.metaDescription,
                    });
                    void copyTextToClipboard(res.suggestedKeywordsCsv);
                  }}
                  onCopyMetaDescription={() => {
                    const res = computeSeoSuggestions({
                      contentHtml: pageForm.body,
                      currentKeywordsCsv: pageForm.keywords,
                      currentMetaDescription: pageForm.metaDescription,
                    });
                    void copyTextToClipboard(res.suggestedMetaDescription);
                  }}
                />
              </FeatureGate>
              <div className="flex flex-wrap gap-2 items-center">
                <button
                  type="button"
                  onClick={creatingPage ? createPage : savePageSeo}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm"
                >
                  {creatingPage ? 'Create page' : 'Save page changes'}
                </button>
                <FeatureGate feature="previewSharing">
                  <button
                    type="button"
                    onClick={() => createPreviewLink("page")}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm"
                    disabled={previewLoading || creatingPage || !selectedPageSlug}
                  >
                    {previewLoading ? "Generating…" : "Preview draft"}
                  </button>
                </FeatureGate>
                {!creatingPage && selectedPageSlug ? (
                  <button
                    type="button"
                    onClick={deleteSelectedPage}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm"
                  >
                    Delete page
                  </button>
                ) : null}
              </div>
              <FeatureGate feature="previewSharing">
                {previewLink ? (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 flex flex-wrap items-center justify-between gap-3">
                    <a
                      href={previewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-700 hover:underline truncate"
                    >
                      {previewLink}
                    </a>
                    <div className="flex gap-2 flex-wrap items-center">
                      <button
                        type="button"
                        onClick={() => void copyTextToClipboard(previewLink)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs hover:bg-slate-50"
                      >
                        Copy link
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewLink(null)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs hover:bg-slate-50"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                ) : null}
              </FeatureGate>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'blogs' && canBlogs && (
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

          <div className="flex flex-col gap-4 border-b border-slate-100/95 bg-gradient-to-r from-slate-50/98 via-white to-violet-50/30 p-5 dark:border-slate-800 dark:from-slate-800/45 dark:via-slate-900/85 dark:to-violet-950/20 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md ring-1 ring-violet-500/30">
                <BookOpen size={22} strokeWidth={2} aria-hidden />
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">
                  Blog posts
                </h2>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  Add, edit, or remove articles — all actions persist in the database. Use{' '}
                  <span className="font-medium text-slate-800 dark:text-slate-200">Save changes</span> when editing an
                  existing post, or <span className="font-medium text-slate-800 dark:text-slate-200">Create post</span>{' '}
                  after starting a new draft.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={startNewBlogPost}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-600/20 transition hover:bg-violet-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 dark:shadow-violet-900/40"
            >
              <Plus size={18} strokeWidth={2.5} aria-hidden />
              New post
            </button>
          </div>

          <div className="flex flex-col lg:flex-row lg:min-h-[min(72vh,760px)]">
            <aside className="flex flex-col border-b border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-950/40 lg:w-[min(100%,22rem)] lg:shrink-0 lg:border-b-0 lg:border-r xl:w-96">
              <div className="space-y-3 p-4 sm:p-5">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Sector
                  </label>
                  <select
                    value={blogSectorFilter}
                    onChange={(e) => setBlogSectorFilter(e.target.value)}
                    className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm transition hover:border-slate-300 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-500"
                  >
                    <option value="">All sectors</option>
                    {sectors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
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
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>
              <div className="min-h-[180px] flex-1 space-y-2 overflow-y-auto px-4 pb-4 sm:px-5 lg:max-h-none lg:flex-1">
                {blogsLoading ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-14 text-sm text-slate-500 dark:text-slate-400">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-500" aria-hidden />
                    Loading posts…
                  </div>
                ) : filteredBlogs.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white/80 p-6 text-center text-sm leading-relaxed text-slate-600 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-400">
                    {blogs.length === 0
                      ? 'No posts yet. Click “New post”, add title, slug, sector, and content, then create.'
                      : 'No posts match your search. Clear the search box or pick another sector.'}
                  </div>
                ) : (
                  filteredBlogs.map((b) => {
                    const isActive = selectedBlogSlug === b.slug;
                    const isLoading = blogLoadingSlug === b.slug;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => void selectBlog(b)}
                        className={`group relative w-full rounded-xl border p-3.5 text-left transition ${
                          isActive
                            ? 'border-violet-500 bg-violet-50/90 shadow-sm ring-1 ring-violet-500/20 dark:border-violet-500/60 dark:bg-violet-950/30 dark:ring-violet-400/20'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100">
                            {b.title}
                          </p>
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-violet-500" aria-hidden />
                          ) : null}
                        </div>
                        <p className="mt-1 font-mono text-[11px] text-slate-500 dark:text-slate-400">/{b.slug}</p>
                        {b.sector?.name ? (
                          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-500">{b.sector.name}</p>
                        ) : null}
                        <span
                          className={`mt-2 inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize ${blogStatusBadgeClass(b.status)}`}
                        >
                          {b.status}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
              <p className="hidden border-t border-slate-200 px-4 py-2.5 text-center text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-500 lg:block">
                {filteredBlogs.length} of {blogs.length} post{blogs.length === 1 ? '' : 's'}
                {blogListSearch.trim() ? ' shown' : ''}
              </p>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6 lg:p-8">
                <div
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    selectedBlogSlug
                      ? 'border-sky-200/90 bg-sky-50/90 text-sky-950 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-100'
                      : 'border-violet-200/90 bg-violet-50/80 text-violet-950 dark:border-violet-900/50 dark:bg-violet-950/25 dark:text-violet-100'
                  }`}
                >
                  {selectedBlogSlug ? (
                    <>
                      <span className="font-semibold">Editing </span>
                      <span className="font-mono text-[13px]">/{selectedBlogSlug}</span>
                      <span className="text-sky-900/80 dark:text-sky-200/90">
                        {' '}
                        — use Save changes to update the database.
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="font-semibold">New post</span>
                      <span className="text-violet-900/85 dark:text-violet-200/90">
                        {' '}
                        — set sector, title, a unique slug, and body, then use Create post below.
                      </span>
                    </>
                  )}
                </div>

                <MarketerBlogFields
                  ref={blogFieldsRef}
                  blogForm={blogForm}
                  setBlogForm={setBlogForm}
                  sectors={sectors}
                  sectorsLoading={sectorsLoading}
                  blogs={blogs}
                  authorLabel={authorLabel}
                  uploading={uploading}
                  activeBlog={blogs.find((b) => b.slug === selectedBlogSlug) ?? null}
                  onUploadFeatured={async (file: File) => {
                    setUploading(true);
                    try {
                      const form = new FormData();
                      form.append('file', file);
                      if (blogForm.title.trim()) form.append('altText', blogForm.title.trim());
                      const res = await fetch('/api/marketer/stored-image', { method: 'POST', body: form });
                      const data = await res.json();
                      if (!res.ok) return;
                      setBlogForm((f) => ({
                        ...f,
                        featuredImage: data.url ?? '',
                        ogImage: f.ogImage || (data.url ?? ''),
                      }));
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
                  }}
                />
                {blogForm.featuredImage ? (
                  <div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={blogForm.featuredImage}
                      alt="Featured preview"
                      className="max-h-52 w-full rounded-xl border border-slate-200 object-cover shadow-sm dark:border-slate-700"
                    />
                  </div>
                ) : null}
                <GoogleSnippetPreview
                  title={blogForm.metaTitle || blogForm.title}
                  description={blogForm.metaDescription}
                  url={`${getSiteOrigin().replace(/\/$/, '')}${publicPathWithLocale(locale, 'news', blogForm.slug || 'sample-post')}`}
                  ogImage={blogForm.ogImage || blogForm.featuredImage}
                />
                <FeatureGate feature="seoScore">
                  <SeoScorePanel
                    metaTitle={blogForm.metaTitle}
                    metaDescription={blogForm.metaDescription}
                    keywords={blogForm.keywords}
                    content={blogForm.content}
                  />
                  <SeoImprovementsPanel
                    content={blogForm.content}
                    keywordsCsv={blogForm.keywords}
                    metaDescription={blogForm.metaDescription}
                    onCopyKeywords={() => {
                      const res = computeSeoSuggestions({
                        contentHtml: blogForm.content,
                        currentKeywordsCsv: blogForm.keywords,
                        currentMetaDescription: blogForm.metaDescription,
                      });
                      void copyTextToClipboard(res.suggestedKeywordsCsv);
                    }}
                    onCopyMetaDescription={() => {
                      const res = computeSeoSuggestions({
                        contentHtml: blogForm.content,
                        currentKeywordsCsv: blogForm.keywords,
                        currentMetaDescription: blogForm.metaDescription,
                      });
                      void copyTextToClipboard(res.suggestedMetaDescription);
                    }}
                  />
                </FeatureGate>
                <FeatureGate feature="previewSharing">
                  {previewLink ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                      <a
                        href={previewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-sm text-blue-700 hover:underline dark:text-blue-400"
                      >
                        {previewLink}
                      </a>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void copyTextToClipboard(previewLink)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                          Copy link
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewLink(null)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  ) : null}
                </FeatureGate>
              </div>

              <div className="sticky bottom-0 z-10 border-t border-slate-200/95 bg-white/95 px-4 py-3 shadow-[0_-4px_24px_rgba(15,23,42,0.06)] backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="hidden max-w-md text-xs text-slate-500 dark:text-slate-400 sm:block">
                    {selectedBlogSlug
                      ? 'Save writes updates to the database. Delete removes the post permanently.'
                      : 'Create post inserts a new row. The URL slug must be unique site-wide.'}
                  </p>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {selectedBlogSlug ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void saveBlogSeo()}
                          disabled={blogActionLoading !== null}
                          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
                        >
                          {blogActionLoading === 'save' ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                          ) : null}
                          Save changes
                        </button>
                        <FeatureGate feature="previewSharing">
                          <button
                            type="button"
                            onClick={() => createPreviewLink('blog')}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                            disabled={previewLoading || (!selectedBlogSlug && !blogForm.slug.trim())}
                          >
                            {previewLoading ? 'Generating…' : 'Preview draft'}
                          </button>
                        </FeatureGate>
                        <button
                          type="button"
                          onClick={() => void deleteSelectedBlog()}
                          disabled={blogActionLoading !== null}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/80 px-4 py-2.5 text-sm font-semibold text-red-800 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200 dark:hover:bg-red-950/50"
                        >
                          {blogActionLoading === 'delete' ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                          ) : (
                            <Trash2 className="h-4 w-4" aria-hidden />
                          )}
                          Delete
                        </button>
                      </>
                    ) : null}
                    {!selectedBlogSlug ? (
                      <button
                        type="button"
                        onClick={() => void createBlog()}
                        disabled={!blogForm.sectorId.trim() || blogActionLoading !== null}
                        className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-600/25 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-violet-900/30"
                      >
                        {blogActionLoading === 'create' ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        ) : (
                          <Plus className="h-4 w-4" aria-hidden />
                        )}
                        Create post
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {((activeTab === 'pages' && canPages) || (activeTab === 'blogs' && canBlogs)) && (
        <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.07)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/25">
          <div className="p-5 border-b border-slate-100/95 bg-gradient-to-r from-slate-50/98 to-white dark:border-slate-800 dark:from-slate-800/45 dark:to-slate-900/85 flex items-center gap-2">
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
                  <div
                    key={img.id}
                    role="button"
                    tabIndex={0}
                    className="text-left rounded-lg border border-slate-200 p-2 hover:border-slate-400"
                    onClick={() => {
                      if (activeTab === 'pages' && canPages) {
                        setPageForm((f) => ({ ...f, ogImage: img.url }));
                      } else {
                        setBlogForm((f) => ({ ...f, featuredImage: img.url, ogImage: img.url }));
                      }
                    }}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyImageUrl(img.url);
                        }}
                        className="px-2 py-1 rounded-md border border-slate-200 bg-white text-slate-700 text-[11px] hover:bg-slate-50"
                      >
                        Copy URL
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteImage(img.key);
                        }}
                        className="p-2 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        aria-label="Delete image"
                        title="Delete image"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.altText ?? img.fileName ?? 'image'} className="w-full h-24 object-cover rounded-md mb-2" />
                    <p className="text-xs font-medium text-slate-800 truncate">{img.fileName ?? img.key}</p>
                    <p className="text-[11px] text-slate-500 truncate">{img.key}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Campaigns */}
      {activeTab === 'campaigns' && (
      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.07)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/25">
        <div className="p-5 border-b border-slate-100/95 bg-gradient-to-r from-slate-50/98 to-white dark:border-slate-800 dark:from-slate-800/45 dark:to-slate-900/85 flex flex-wrap items-center justify-between gap-4">
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
      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.07)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/25">
        <div className="p-5 border-b border-slate-100/95 bg-gradient-to-r from-slate-50/98 to-white dark:border-slate-800 dark:from-slate-800/45 dark:to-slate-900/85 flex flex-wrap items-center justify-between gap-4">
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
