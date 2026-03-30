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
} from 'lucide-react';
import VisitStatsLazy from './VisitStatsLazy';
import MyActivityPanel from './MyActivityPanel';
import { useDashboardShortcuts } from '@/components/dashboard/DashboardShortcutsProvider';
import type { Role } from '@/lib/constants';
import { getDashboardTitle } from '@/lib/dashboard-title';
import { pickCanonicalSectorRows } from '@/lib/company-divisions';
import FeatureGate from '@/components/FeatureGate';
import DashboardPageHeader from './DashboardPageHeader';

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

type BlogRow = {
  id: string;
  title: string;
  slug: string;
  content: string;
  sectorId: string | null;
  sector?: { id: string; name: string; slug: string } | null;
  featuredImage: string | null;
  status: 'draft' | 'published';
  publishedAt: string | null;
  scheduledPublishAt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  keywords: string | null;
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
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500 mb-1">Google preview</p>
      <p className="text-sm text-emerald-700 truncate">{url || 'https://example.com/page-url'}</p>
      <p className="text-[18px] leading-6 text-blue-700 hover:underline truncate">
        {title || 'Your page title appears here'}
      </p>
      <p className="text-sm text-slate-600 line-clamp-2">
        {description || 'Your meta description appears here for search users.'}
      </p>
      {ogImage ? (
        <div className="mt-3 rounded-lg border border-slate-200 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ogImage} alt="OG preview" className="w-full h-28 object-cover bg-slate-100" />
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
}: {
  locale: string;
  viewerRole: Role;
}) {
  const base = `/${locale}`;
  const { data: sessionData } = useSession();
  const { pushSaveLayer } = useDashboardShortcuts();
  const authorLabel = sessionData?.user?.email ?? sessionData?.user?.name ?? '—';
  const [activeTab, setActiveTab] = useState<'campaigns' | 'links' | 'pages' | 'blogs'>('pages');

  const [previewLink, setPreviewLink] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const canPages =
    viewerRole === 'DIGITAL_MARKETER' || viewerRole === 'ADMIN' || viewerRole === 'SUPER_ADMIN';
  const canBlogs =
    viewerRole === 'DIGITAL_MARKETER' || viewerRole === 'ADMIN' || viewerRole === 'SUPER_ADMIN';

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
    { value: 'companies-dealsmedi', label: 'Companies (Dealsmedi)' },
    { value: 'companies-dlsin', label: 'Companies (Dlsin)' },
    { value: 'companies-janatha-mirror', label: 'Companies (Janatha Mirror)' },
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
  const [blogs, setBlogs] = useState<BlogRow[]>([]);
  const [blogsLoading, setBlogsLoading] = useState(true);
  const [sectors, setSectors] = useState<SectorRow[]>([]);
  const [sectorsLoading, setSectorsLoading] = useState(true);
  const [blogSectorFilter, setBlogSectorFilter] = useState('');
  const [selectedBlogSlug, setSelectedBlogSlug] = useState('');
  const [blogForm, setBlogForm] = useState({
    title: '',
    slug: '',
    content: '',
    sectorId: '',
    featuredImage: '',
    status: 'draft' as 'draft' | 'published',
    publishedAt: '',
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
    fetch(`/api/marketer/page-content?locale=${encodeURIComponent(locale)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const items = (d?.items ?? []) as PageContentRow[];
        setPages(items);
        if (items[0]) selectPage(items[0]);
      })
      .catch(() => setPages([]))
      .finally(() => setPagesLoading(false));
  }, [locale]);

  useEffect(() => {
    const qs = blogSectorFilter
      ? `?sectorId=${encodeURIComponent(blogSectorFilter)}`
      : '';
    fetch(`/api/marketer/blog${qs}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const items = (d?.items ?? []) as BlogRow[];
        setBlogs(items);
        if (items[0]) {
          selectBlog(items[0]);
        } else {
          setSelectedBlogSlug('');
          setBlogForm((f) => ({
            ...f,
            title: '',
            slug: '',
            content: '',
            sectorId: blogSectorFilter,
            featuredImage: '',
            status: 'draft',
            publishedAt: '',
            scheduledPublishAt: '',
            seoNote: '',
            metaTitle: '',
            metaDescription: '',
            keywords: '',
            canonicalUrl: '',
            ogTitle: '',
            ogDescription: '',
            ogImage: '',
          }));
        }
      })
      .catch(() => setBlogs([]))
      .finally(() => setBlogsLoading(false));
  }, [blogSectorFilter]);

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

  function selectBlog(blog: BlogRow) {
    setSelectedBlogSlug(blog.slug);
    setBlogForm({
      title: blog.title ?? '',
      slug: blog.slug ?? '',
      content: blog.content ?? '',
      sectorId: blog.sectorId ?? '',
      featuredImage: blog.featuredImage ?? '',
      status: blog.status ?? 'draft',
      publishedAt: blog.publishedAt ? new Date(blog.publishedAt).toISOString().slice(0, 10) : '',
      scheduledPublishAt: toDateTimeLocalValue(blog.scheduledPublishAt),
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
    setSelectedBlogSlug(item.slug);
    setBlogForm((f) => ({
      ...f,
      title: item.title,
      slug: item.slug,
      content: item.content,
      sectorId: item.sectorId ?? '',
      featuredImage: item.featuredImage ?? '',
      status: item.status ?? 'draft',
      publishedAt: item.publishedAt ? new Date(item.publishedAt).toISOString().slice(0, 10) : '',
      scheduledPublishAt: toDateTimeLocalValue(item.scheduledPublishAt),
      seoNote: '',
      metaTitle: item.metaTitle ?? '',
      metaDescription: item.metaDescription ?? '',
      keywords: item.keywords ?? '',
      canonicalUrl: '',
      ogTitle: item.ogTitle ?? '',
      ogDescription: item.ogDescription ?? '',
      ogImage: item.ogImage ?? '',
    }));
  }

  async function deleteSelectedBlog() {
    if (!selectedBlogSlug) return;
    if (!confirm('Delete this blog?')) return;

    const res = await fetch(`/api/marketer/blog/${encodeURIComponent(selectedBlogSlug)}`, {
      method: 'DELETE',
    });
    if (!res.ok) return;

    const remaining = blogs.filter((b) => b.slug !== selectedBlogSlug);
    setBlogs(remaining);

    if (remaining[0]) selectBlog(remaining[0]);
    else {
      setSelectedBlogSlug('');
      setBlogForm({
        title: '',
        slug: '',
        content: '',
        sectorId: '',
        featuredImage: '',
        status: 'draft',
        publishedAt: '',
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
  }

  async function createBlog() {
    if (!blogForm.title.trim() || !blogForm.slug.trim() || !blogForm.content.trim()) return;
    if (!blogForm.sectorId.trim()) return;
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
      const payload =
        kind === "page"
          ? { kind, slug: selectedPageSlug, locale }
          : { kind, slug: selectedBlogSlug, locale };

      if (!payload.slug) {
        alert("Please select a draft item first.");
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
    if (activeTab === 'pages') {
      if (creatingPage) void createPage();
      else if (selectedPageSlug) void savePageSeo();
    } else if (activeTab === 'blogs') {
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
        description="Analytics, campaigns, and marketing tools. All data is stored in the database."
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
            href={`${base}/contact`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all hover:border-blue-200/80 hover:shadow-md dark:border-slate-600 dark:bg-slate-800/40 dark:hover:border-blue-500/40"
          >
            <Mail size={22} className="shrink-0 text-blue-700 dark:text-blue-400" />
            <span className="font-medium text-slate-800 dark:text-slate-100">Contact page</span>
          </Link>
          <Link
            href={`${base}/dashboard/analytics`}
            className="flex items-center gap-3 rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all hover:border-violet-200/80 hover:shadow-md dark:border-slate-600 dark:bg-slate-800/40 dark:hover:border-violet-500/40"
          >
            <BarChart3 size={22} className="shrink-0 text-violet-600 dark:text-violet-400" />
            <span className="font-medium text-slate-800 dark:text-slate-100">Analytics</span>
          </Link>
        </div>
      </section>

      <VisitStatsLazy />

      <section className="rounded-2xl border border-slate-200/90 bg-white p-2 shadow-[0_1px_3px_rgba(15,23,42,0.07)] dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/25">
        <div className="flex flex-wrap gap-1 sm:gap-1.5">
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
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-sm dark:bg-blue-600'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {activeTab === 'pages' && (
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
                url={pageForm.canonicalUrl || `https://doddapanenigroup.net/${locale}/${selectedPageSlug || ''}`}
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

      {activeTab === 'blogs' && (
        <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.07)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/25">
          <div className="p-5 border-b border-slate-100/95 bg-gradient-to-r from-slate-50/98 to-white dark:border-slate-800 dark:from-slate-800/45 dark:to-slate-900/85">
            <h2 className="text-lg font-semibold text-slate-800">Blog management + SEO</h2>
          </div>
          <div className="p-5 grid lg:grid-cols-3 gap-5">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Blog posts</p>
              <select
                value={blogSectorFilter}
                onChange={(e) => setBlogSectorFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">All sectors</option>
                {sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {blogsLoading ? (
                <p className="text-sm text-slate-500">Loading blogs...</p>
              ) : (
                <div className="max-h-[420px] overflow-auto space-y-2">
                  {blogs.map((b) => (
                    <button key={b.id} type="button" onClick={() => selectBlog(b)} className={`w-full text-left p-3 rounded-lg border ${selectedBlogSlug === b.slug ? 'border-slate-700 bg-slate-100' : 'border-slate-200 bg-white'}`}>
                      <p className="text-sm font-medium text-slate-900">{b.title}</p>
                      <p className="text-xs text-slate-500">/{b.slug}</p>
                      {b.sector?.name ? (
                        <p className="text-[11px] text-slate-500">{b.sector.name}</p>
                      ) : null}
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs bg-slate-200 text-slate-700">
                        {b.status}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="lg:col-span-2 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <input value={blogForm.title} onChange={(e) => setBlogForm((f) => ({ ...f, title: e.target.value }))} placeholder="Blog title" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <input value={blogForm.slug} onChange={(e) => setBlogForm((f) => ({ ...f, slug: e.target.value }))} placeholder="Slug (example: best-packers-movers)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <select
                  value={blogForm.sectorId}
                  onChange={(e) => setBlogForm((f) => ({ ...f, sectorId: e.target.value }))}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">{sectorsLoading ? 'Loading sectors...' : 'Select sector *'}</option>
                  {sectors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <input value={authorLabel} disabled placeholder="Author" className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
              </div>
              <textarea value={blogForm.content} onChange={(e) => setBlogForm((f) => ({ ...f, content: e.target.value }))} placeholder="Blog content" rows={8} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <div className="grid sm:grid-cols-2 gap-3">
                <select
                  value={blogForm.status}
                  onChange={(e) =>
                    setBlogForm((f) => {
                      const nextStatus = e.target.value as 'draft' | 'published';
                      return { ...f, status: nextStatus, publishedAt: nextStatus === 'published' ? f.publishedAt : '' };
                    })
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
                <input
                  type="date"
                  value={blogForm.publishedAt}
                  onChange={(e) => setBlogForm((f) => ({ ...f, publishedAt: e.target.value }))}
                  disabled={blogForm.status !== 'published'}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <FeatureGate feature="scheduling">
                  <>
                    <input
                      type="datetime-local"
                      value={blogForm.scheduledPublishAt}
                      onChange={(e) => setBlogForm((f) => ({ ...f, scheduledPublishAt: e.target.value }))}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
                      placeholder="Scheduled publish date/time"
                    />
                    <p className="text-xs text-slate-500 sm:col-span-2 -mt-2">
                      Optional: if set to a future time, the blog post won’t show publicly until scheduledPublishAt is due.
                    </p>
                  </>
                </FeatureGate>
                <div className="sm:col-span-2 grid sm:grid-cols-2 gap-3">
                  <div>
                    <input
                      value={blogForm.featuredImage}
                      onChange={(e) => setBlogForm((f) => ({ ...f, featuredImage: e.target.value }))}
                      placeholder="Featured image URL"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm w-full"
                    />
                    <p className="text-xs text-slate-500 mt-1">Or upload a file below</p>
                  </div>
                  <label className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 cursor-pointer bg-white flex items-center justify-center">
                    {uploading ? 'Uploading…' : 'Upload featured image'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploading(true);
                        try {
                          const form = new FormData();
                          form.append('file', file);
                          // Use blog title as alt text when available
                          if (blogForm.title.trim()) form.append('altText', blogForm.title.trim());
                          const res = await fetch('/api/marketer/stored-image', { method: 'POST', body: form });
                          const data = await res.json();
                          if (!res.ok) return;
                          // stored-image endpoint always converts uploads to .webp
                          setBlogForm((f) => ({
                            ...f,
                            featuredImage: data.url ?? '',
                            ogImage: f.ogImage || (data.url ?? ''),
                          }));
                        } finally {
                          setUploading(false);
                        }
                      }}
                    />
                  </label>
                </div>
                {blogForm.featuredImage ? (
                  <div className="sm:col-span-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={blogForm.featuredImage} alt="Featured preview" className="w-full h-32 object-cover rounded-lg border border-slate-200 mt-1" />
                  </div>
                ) : null}
                <input value={blogForm.metaTitle} onChange={(e) => setBlogForm((f) => ({ ...f, metaTitle: e.target.value }))} placeholder="Meta title" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <input value={blogForm.keywords} onChange={(e) => setBlogForm((f) => ({ ...f, keywords: e.target.value }))} placeholder="Keywords" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <textarea value={blogForm.metaDescription} onChange={(e) => setBlogForm((f) => ({ ...f, metaDescription: e.target.value }))} placeholder="Meta description" rows={3} className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
                <input value={blogForm.ogTitle} onChange={(e) => setBlogForm((f) => ({ ...f, ogTitle: e.target.value }))} placeholder="OG title" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <input value={blogForm.ogImage} onChange={(e) => setBlogForm((f) => ({ ...f, ogImage: e.target.value }))} placeholder="OG image URL" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <textarea value={blogForm.ogDescription} onChange={(e) => setBlogForm((f) => ({ ...f, ogDescription: e.target.value }))} placeholder="OG description" rows={2} className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
              </div>
              <input value={blogForm.seoNote} onChange={(e) => setBlogForm((f) => ({ ...f, seoNote: e.target.value }))} placeholder="Note for team (saved in logs)" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <GoogleSnippetPreview
                title={blogForm.metaTitle || blogForm.title}
                description={blogForm.metaDescription}
                url={`https://doddapanenigroup.net/${locale === 'en' ? '' : `${locale}/`}news/${blogForm.slug || 'sample-post'}`}
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
              <div className="flex gap-2 flex-wrap">
                <button type="button" onClick={saveBlogSeo} className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm">Save blog</button>
                <FeatureGate feature="previewSharing">
                  <button
                    type="button"
                    onClick={() => createPreviewLink("blog")}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm"
                    disabled={previewLoading || !selectedBlogSlug}
                  >
                    {previewLoading ? "Generating…" : "Preview draft"}
                  </button>
                </FeatureGate>
                <button
                  type="button"
                  onClick={createBlog}
                  disabled={!blogForm.sectorId}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-sm text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create new blog
                </button>
                {selectedBlogSlug ? (
                  <button
                    type="button"
                    onClick={deleteSelectedBlog}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm"
                  >
                    Delete blog
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

      {(activeTab === 'pages' || activeTab === 'blogs') && (
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
                      if (activeTab === 'pages') {
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
