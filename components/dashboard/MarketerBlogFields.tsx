'use client';

import { useImperativeHandle, forwardRef, useEffect, useRef, useState, useMemo, useId } from 'react';
import {
  ChevronDown,
  FileText,
  Link2,
  Search,
  Share2,
  Image as ImageIcon,
  Megaphone,
  LayoutTemplate,
  Sparkles,
  User,
} from 'lucide-react';
import type { TranslationPatch } from '@/lib/marketer-news-fields';
import type { BlogFormState, BlogListRow } from '@/lib/marketer-blog-form';
import { BlogRichContentField } from '@/components/dashboard/BlogRichContentField';
import { dashboardInputClass, dashboardNestedCardClass } from '@/lib/dashboard-ui';
import { slugifyFromArticleTitle, slugifyPastedForUrlField } from '@/lib/news-slug-normalize';
import GoogleSnippetPreview from '@/components/dashboard/GoogleSnippetPreview';
import BlogSeoScorePanel from '@/components/dashboard/BlogSeoScorePanel';
import { getSiteOrigin } from '@/lib/site-origin';
import { publicPathWithLocale } from '@/lib/public-path-with-locale';

type SectorOption = { id: string; name: string; slug: string };

/** Legacy shape for no-op `hydrateTranslationDrafts` (news is English-only on `/news`). */
export type TranslationDraftHydration = Record<string, Record<string, unknown>>;

export type MarketerBlogFieldsHandle = {
  getTranslationPatches: () => TranslationPatch[];
  hydrateTranslationDrafts: (byLocale: TranslationDraftHydration) => void;
};

type Props = {
  blogForm: BlogFormState;
  setBlogForm: React.Dispatch<React.SetStateAction<BlogFormState>>;
  sectors: SectorOption[];
  sectorsLoading: boolean;
  authorLabel: string;
  uploading: boolean;
  activeBlog: BlogListRow | null;
  onUploadFeatured: (file: File) => Promise<void>;
  onUploadOg?: (file: File) => Promise<void>;
  onUploadBanner?: (file: File) => Promise<void>;
  /** Append uploaded image URL to gallery list (max 8). */
  onAppendGalleryImage?: (file: File) => Promise<void>;
  locale: string;
};

const fieldClass = dashboardInputClass;
const labelClass =
  'mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400';

const ROBOTS_PRESETS: { label: string; value: string }[] = [
  { label: 'Index / Follow', value: 'index,follow' },
  { label: 'Noindex / Nofollow', value: 'noindex,nofollow' },
  { label: 'Index / Nofollow', value: 'index,nofollow' },
  { label: 'Noindex / Follow', value: 'noindex,follow' },
];

const AD_POSITIONS = [
  { label: 'Header top', value: 'header_top' },
  { label: 'Below header', value: 'below_header' },
  { label: 'Inside content', value: 'inside_content' },
  { label: 'Sidebar top', value: 'sidebar_top' },
  { label: 'Footer', value: 'footer' },
];

const AD_TYPES = ['Display', 'Native', 'Sponsored', 'Affiliate'] as const;
const AD_SIZES = ['Leaderboard (728×90)', 'Medium rectangle (300×250)', 'Billboard (970×250)', 'Half-page (300×600)', 'Mobile banner (320×50)'] as const;

const MAX_GALLERY_ITEMS = 8;

/** Topic labels for “category ads” (stored as slugs in `categorySlugs`). */
const CATEGORY_AD_TOPICS: { label: string; slug: string }[] = [
  { label: 'SEO', slug: 'seo' },
  { label: 'Digital Marketing', slug: 'digital-marketing' },
  { label: 'Web Development', slug: 'web-development' },
  { label: 'Real Estate', slug: 'real-estate' },
  { label: 'Healthcare', slug: 'healthcare' },
  { label: 'Content Marketing', slug: 'content-marketing' },
];

const AD_CATEGORY_OPTIONS = [
  'General',
  'SEO',
  'Digital Marketing',
  'Web Development',
  'Real Estate',
  'Lead generation',
] as const;

function youtubeEmbedUrl(raw: string): string | null {
  const u = raw.trim();
  const m = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

function splitGalleryUrls(raw: string): string[] {
  return (raw ?? '')
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseTagList(tags: string): string[] {
  return (tags ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

function joinTagList(parts: string[]): string {
  return parts.join(', ');
}

type SectionAccent = 'violet' | 'emerald' | 'fuchsia' | 'amber' | 'rose' | 'sky';

const accentStyles: Record<
  SectionAccent,
  { bar: string; iconBg: string; iconText: string; ring: string }
> = {
  violet: {
    bar: 'bg-violet-500',
    iconBg: 'bg-violet-100 dark:bg-violet-950/60',
    iconText: 'text-violet-700 dark:text-violet-200',
    ring: 'ring-violet-200/80 dark:ring-violet-800/50',
  },
  emerald: {
    bar: 'bg-emerald-500',
    iconBg: 'bg-emerald-100 dark:bg-emerald-950/60',
    iconText: 'text-emerald-700 dark:text-emerald-200',
    ring: 'ring-emerald-200/80 dark:ring-emerald-800/50',
  },
  fuchsia: {
    bar: 'bg-fuchsia-500',
    iconBg: 'bg-fuchsia-100 dark:bg-fuchsia-950/60',
    iconText: 'text-fuchsia-700 dark:text-fuchsia-200',
    ring: 'ring-fuchsia-200/80 dark:ring-fuchsia-800/50',
  },
  amber: {
    bar: 'bg-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-950/60',
    iconText: 'text-amber-900 dark:text-amber-100',
    ring: 'ring-amber-200/80 dark:ring-amber-800/50',
  },
  rose: {
    bar: 'bg-rose-500',
    iconBg: 'bg-rose-100 dark:bg-rose-950/60',
    iconText: 'text-rose-700 dark:text-rose-200',
    ring: 'ring-rose-200/80 dark:ring-rose-800/50',
  },
  sky: {
    bar: 'bg-sky-500',
    iconBg: 'bg-sky-100 dark:bg-sky-950/60',
    iconText: 'text-sky-800 dark:text-sky-200',
    ring: 'ring-sky-200/80 dark:ring-sky-800/50',
  },
};

function EditorSection({
  sectionNumber,
  title,
  subtitle,
  accent,
  icon,
  defaultOpen = true,
  children,
}: {
  sectionNumber: number;
  title: string;
  subtitle?: string;
  accent: SectionAccent;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const a = accentStyles[accent];
  return (
    <div
      className={`overflow-hidden rounded-lg border border-slate-200/90 bg-white shadow-sm ring-1 ${a.ring} dark:border-slate-700 dark:bg-slate-900`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
      >
        <span className={`mt-0.5 h-full min-h-[2.75rem] w-1 shrink-0 rounded-full ${a.bar}`} aria-hidden />
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${a.iconBg} ${a.iconText}`}
        >
          {icon}
        </span>
        <span className="min-w-0 flex-1 pt-0.5">
          <span className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              {sectionNumber}.
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-800 dark:text-slate-100">
              {title}
            </span>
          </span>
          {subtitle ? (
            <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{subtitle}</span>
          ) : null}
        </span>
        <ChevronDown
          className={`mt-1 h-5 w-5 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {open ? <div className="border-t border-slate-100 px-4 pb-5 pt-1 dark:border-slate-800">{children}</div> : null}
    </div>
  );
}

function SocialFacebookPreview({
  ogTitle,
  ogDescription,
  ogImage,
  fallbackTitle,
  fallbackDescription,
  fallbackImage,
  domain,
}: {
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  fallbackTitle: string;
  fallbackDescription: string;
  fallbackImage: string;
  domain: string;
}) {
  const title = ogTitle.trim() || fallbackTitle.trim() || 'Post title';
  const desc = ogDescription.trim() || fallbackDescription.trim() || 'Description shown when this link is shared.';
  const img = ogImage.trim() || fallbackImage.trim();
  return (
    <div className={`overflow-hidden ${dashboardNestedCardClass}`}>
      <p className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
        Social preview (Facebook)
      </p>
      <div className="border-b border-slate-100 bg-[#f0f2f5] p-3 dark:border-slate-700 dark:bg-slate-950/50">
        <div className="mx-auto max-w-[340px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-600">
          <div className="aspect-[1.91/1] w-full bg-slate-200 dark:bg-slate-800">
            {img ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={img} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">No image</div>
            )}
          </div>
          <div className="space-y-1 px-3 py-2.5">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">{domain}</p>
            <p className="line-clamp-2 text-[15px] font-semibold leading-snug text-slate-900 dark:text-white">{title}</p>
            <p className="line-clamp-3 text-xs leading-snug text-slate-600 dark:text-slate-400">{desc}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export const MarketerBlogFields = forwardRef<MarketerBlogFieldsHandle, Props>(function MarketerBlogFields(
  {
    blogForm,
    setBlogForm,
    sectors,
    sectorsLoading,
    authorLabel,
    uploading,
    activeBlog,
    onUploadFeatured,
    onUploadOg,
    onUploadBanner,
    onAppendGalleryImage,
    locale,
  }: Props,
  ref,
) {
  const slugDecoupledFromTitleRef = useRef(false);
  const tagInputId = useId();

  useEffect(() => {
    slugDecoupledFromTitleRef.current = activeBlog != null;
  }, [activeBlog]);

  useImperativeHandle(ref, () => ({
    getTranslationPatches: (): TranslationPatch[] => [],
    hydrateTranslationDrafts: (_byLocale: TranslationDraftHydration) => {
      void _byLocale;
      /* no-op: /news is English-only */
    },
  }));

  const publicArticleUrl = useMemo(() => {
    const origin = getSiteOrigin().replace(/\/$/, '');
    const path = publicPathWithLocale(locale, 'news', blogForm.slug.trim() || 'your-post-slug');
    return `${origin}${path}`;
  }, [locale, blogForm.slug]);

  const previewDomain = useMemo(() => {
    try {
      return new URL(getSiteOrigin()).hostname.replace(/^www\./, '');
    } catch {
      return 'yoursite.com';
    }
  }, []);

  const galleryUrls = useMemo(() => splitGalleryUrls(blogForm.galleryImageUrls), [blogForm.galleryImageUrls]);
  const tagChips = useMemo(() => parseTagList(blogForm.tags), [blogForm.tags]);

  const robotsSelectValue = useMemo(() => {
    const cur = blogForm.metaRobots.trim().toLowerCase();
    const hit = ROBOTS_PRESETS.find((p) => p.value.toLowerCase() === cur);
    return hit ? hit.value : '';
  }, [blogForm.metaRobots]);

  const youtubePreview = youtubeEmbedUrl(blogForm.embeddedVideoUrl);

  const adSizeFromOutbound = useMemo(() => {
    try {
      const j = JSON.parse(blogForm.outboundLinksJson.trim() || '{}');
      return typeof j.adSize === 'string' ? j.adSize : '';
    } catch {
      return '';
    }
  }, [blogForm.outboundLinksJson]);

  const adTypeFromOutbound = useMemo(() => {
    try {
      const j = JSON.parse(blogForm.outboundLinksJson.trim() || '{}');
      return typeof j.adType === 'string' ? j.adType : '';
    } catch {
      return '';
    }
  }, [blogForm.outboundLinksJson]);

  const adCategoryFromOutbound = useMemo(() => {
    try {
      const j = JSON.parse(blogForm.outboundLinksJson.trim() || '{}');
      return typeof j.adCategory === 'string' ? j.adCategory : '';
    } catch {
      return '';
    }
  }, [blogForm.outboundLinksJson]);

  const outboundMediaExtras = useMemo(() => {
    try {
      const j = JSON.parse(blogForm.outboundLinksJson.trim() || '{}');
      return {
        featuredCaption: typeof j.featuredCaption === 'string' ? j.featuredCaption : '',
        featuredDescriptionBackend:
          typeof j.featuredDescriptionBackend === 'string' ? j.featuredDescriptionBackend : '',
      };
    } catch {
      return { featuredCaption: '', featuredDescriptionBackend: '' };
    }
  }, [blogForm.outboundLinksJson]);

  function mergeOutboundPatch(patch: Record<string, unknown>): void {
    setBlogForm((f) => {
      try {
        const cur = f.outboundLinksJson.trim();
        const base = cur ? JSON.parse(cur) : {};
        const next =
          typeof base === 'object' && base !== null && !Array.isArray(base)
            ? { ...(base as Record<string, unknown>) }
            : {};
        for (const [k, v] of Object.entries(patch)) {
          if (v === '' || v === undefined) delete next[k];
          else next[k] = v;
        }
        const keys = Object.keys(next);
        return {
          ...f,
          outboundLinksJson: keys.length ? JSON.stringify(next) : '',
        };
      } catch {
        return {
          ...f,
          outboundLinksJson: JSON.stringify(patch),
        };
      }
    });
  }

  const metaTitleLen = blogForm.metaTitle.length;
  const metaDescLen = blogForm.metaDescription.length;
  const titleLen = blogForm.title.length;
  const excerptLen = blogForm.excerpt.length;
  const teamNoteLen = blogForm.seoNote.length;

  function toggleCategorySlug(slug: string, checked: boolean) {
    const set = new Set(
      blogForm.categorySlugs
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    );
    if (checked) set.add(slug);
    else set.delete(slug);
    setBlogForm((f) => ({ ...f, categorySlugs: Array.from(set).join(', ') }));
  }

  function removeGalleryUrl(url: string) {
    const next = splitGalleryUrls(blogForm.galleryImageUrls).filter((u) => u !== url);
    setBlogForm((f) => ({ ...f, galleryImageUrls: next.join('\n') }));
  }

  function addTag(raw: string) {
    const t = raw.trim();
    if (!t) return;
    const next = parseTagList(blogForm.tags);
    if (next.some((x) => x.toLowerCase() === t.toLowerCase())) return;
    next.push(t);
    setBlogForm((f) => ({ ...f, tags: joinTagList(next) }));
  }

  return (
    <div className="space-y-4">
      <EditorSection
        sectionNumber={1}
        title="Core, content & author"
        subtitle="Title, URL, sector, article body, and byline."
        accent="violet"
        icon={<FileText className="h-5 w-5" strokeWidth={2} aria-hidden />}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <label className={labelClass + ' mb-0'}>Title</label>
              <span className="text-[11px] font-medium tabular-nums text-slate-500 dark:text-slate-400">
                {titleLen}
              </span>
            </div>
            <input
              className={`${fieldClass} rounded-lg`}
              value={blogForm.title}
              onChange={(e) => {
                const title = e.target.value;
                setBlogForm((f) => ({
                  ...f,
                  title,
                  ...(!slugDecoupledFromTitleRef.current ? { slug: slugifyFromArticleTitle(title) } : {}),
                }));
              }}
              placeholder="The Future of Real Estate: Trends to watch in 2026"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Slug (URL)</label>
            <div className="relative">
              <input
                className={`${fieldClass} rounded-lg pr-10 font-mono text-[13px]`}
                value={blogForm.slug}
                onChange={(e) => {
                  slugDecoupledFromTitleRef.current = true;
                  setBlogForm((f) => ({ ...f, slug: e.target.value }));
                }}
                onPaste={(e) => {
                  const text = e.clipboardData.getData('text/plain');
                  const normalized = slugifyPastedForUrlField(text);
                  if (normalized === '') return;
                  e.preventDefault();
                  slugDecoupledFromTitleRef.current = true;
                  setBlogForm((f) => ({ ...f, slug: normalized }));
                }}
                placeholder="your-post-url"
                aria-describedby="slug-hint"
              />
              <Link2
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
            </div>
            <p id="slug-hint" className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Auto-generated from the title until you edit it manually.
            </p>
          </div>
          <div>
            <label className={labelClass}>Sector</label>
            <select
              className={`${fieldClass} rounded-lg`}
              value={blogForm.sectorId}
              onChange={(e) => setBlogForm((f) => ({ ...f, sectorId: e.target.value }))}
            >
              <option value="">{sectorsLoading ? 'Loading…' : 'Select sector *'}</option>
              {sectors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <label className={labelClass + ' mb-0'}>Short description / excerpt</label>
              <span className="text-[11px] font-medium tabular-nums text-slate-500 dark:text-slate-400">
                {excerptLen}
              </span>
            </div>
            <textarea
              className={`${fieldClass} rounded-lg`}
              rows={3}
              value={blogForm.excerpt}
              onChange={(e) => setBlogForm((f) => ({ ...f, excerpt: e.target.value }))}
              placeholder="Card and SERP-friendly summary"
            />
          </div>
          <BlogRichContentField
            instanceKey={`blog-main-${activeBlog?.id ?? 'new'}`}
            label="Full article"
            value={blogForm.content}
            onChange={(content) => setBlogForm((f) => ({ ...f, content }))}
            placeholder="Write and format your article — bold, headings, lists, and alignment work like Word."
            minHeightClass="min-h-[22rem] sm:min-h-[26rem]"
          />
          <div>
            <label className={labelClass}>Author (account)</label>
            <div className="relative">
              <User
                className="pointer-events-none absolute left-3 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <select
                className={`${fieldClass} rounded-lg pl-10`}
                disabled
                value="current"
                aria-label="Author account"
              >
                <option value="current">{authorLabel}</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Author display name</label>
            <input
              className={fieldClass}
              value={blogForm.authorDisplayName}
              onChange={(e) => setBlogForm((f) => ({ ...f, authorDisplayName: e.target.value }))}
              placeholder="Shown instead of account name if set"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Author bio (optional)</label>
            <textarea
              className={fieldClass}
              rows={2}
              value={blogForm.authorBio}
              onChange={(e) => setBlogForm((f) => ({ ...f, authorBio: e.target.value }))}
              placeholder="Short bio for trust / schema"
            />
          </div>
        </div>
      </EditorSection>

      <EditorSection
        sectionNumber={2}
        title="SEO & URL"
        subtitle="Search snippets, robots, and keyword targeting."
        accent="emerald"
        icon={<Search className="h-5 w-5" strokeWidth={2} aria-hidden />}
      >
        <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start xl:gap-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <label className={labelClass + ' mb-0'}>Meta title</label>
                <span
                  className={`text-[11px] font-medium tabular-nums ${metaTitleLen > 60 ? 'text-amber-600' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  {metaTitleLen} / 60
                </span>
              </div>
              <input
                className={`${fieldClass} rounded-lg`}
                value={blogForm.metaTitle}
                onChange={(e) => setBlogForm((f) => ({ ...f, metaTitle: e.target.value }))}
                placeholder="Shown in browser tab and Google blue link"
              />
            </div>
            <div className="sm:col-span-2">
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <label className={labelClass + ' mb-0'}>Meta description</label>
                <span
                  className={`text-[11px] font-medium tabular-nums ${metaDescLen > 160 ? 'text-amber-600' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  {metaDescLen} / 160
                </span>
              </div>
              <textarea
                className={`${fieldClass} rounded-lg`}
                rows={3}
                value={blogForm.metaDescription}
                onChange={(e) => setBlogForm((f) => ({ ...f, metaDescription: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass}>Focus keyword</label>
              <input
                className={`${fieldClass} rounded-lg`}
                value={blogForm.focusKeyword}
                onChange={(e) => setBlogForm((f) => ({ ...f, focusKeyword: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass}>Secondary keywords</label>
              <textarea
                className={`${fieldClass} rounded-lg`}
                rows={3}
                value={blogForm.secondaryKeywords}
                onChange={(e) => setBlogForm((f) => ({ ...f, secondaryKeywords: e.target.value }))}
                placeholder="Comma-separated"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Meta tags</label>
              <div className="flex min-h-[2.75rem] flex-wrap gap-1.5 rounded-lg border border-slate-300 bg-white px-2 py-2 dark:border-slate-600 dark:bg-slate-900">
                {tagChips.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      const next = tagChips.filter((t) => t !== tag);
                      setBlogForm((f) => ({ ...f, tags: joinTagList(next) }));
                    }}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800 ring-1 ring-slate-200 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-600 dark:hover:bg-slate-700"
                  >
                    {tag}
                    <span className="text-slate-500">×</span>
                  </button>
                ))}
                <input
                  id={tagInputId}
                  type="text"
                  className="min-w-[8rem] flex-1 border-0 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-slate-400 dark:text-white"
                  placeholder="Add tag, Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addTag((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Robots meta</label>
              <select
                className={`${fieldClass} rounded-lg`}
                value={robotsSelectValue}
                onChange={(e) => {
                  const v = e.target.value;
                  setBlogForm((f) => ({ ...f, metaRobots: v }));
                }}
              >
                <option value="">Custom (use field below)</option>
                {ROBOTS_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              {!robotsSelectValue ? (
                <input
                  className={`${fieldClass} mt-2 rounded-lg`}
                  value={blogForm.metaRobots}
                  onChange={(e) => setBlogForm((f) => ({ ...f, metaRobots: e.target.value }))}
                  placeholder="index,follow"
                />
              ) : null}
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Keywords (legacy / combined)</label>
              <input
                className={`${fieldClass} rounded-lg`}
                value={blogForm.keywords}
                onChange={(e) => setBlogForm((f) => ({ ...f, keywords: e.target.value }))}
                placeholder="Optional combined keyword field used by SEO scoring"
              />
            </div>
          </div>
          <BlogSeoScorePanel
            layout="side"
            title={blogForm.title}
            slug={blogForm.slug}
            metaTitle={blogForm.metaTitle}
            metaDescription={blogForm.metaDescription}
            keywords={blogForm.keywords}
            focusKeyword={blogForm.focusKeyword}
            content={blogForm.content}
            ogImage={blogForm.ogImage?.trim() || blogForm.featuredImage?.trim() || null}
          />
        </div>
      </EditorSection>

      <EditorSection
        sectionNumber={3}
        title="Social sharing (OG + Twitter)"
        subtitle="Open Graph defaults for Facebook and similar surfaces."
        accent="violet"
        icon={<Share2 className="h-5 w-5" strokeWidth={2} aria-hidden />}
      >
        <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
          <div className="space-y-4">
            <div>
              <label className={labelClass}>OG title</label>
              <input
                className={fieldClass}
                value={blogForm.ogTitle}
                onChange={(e) => setBlogForm((f) => ({ ...f, ogTitle: e.target.value }))}
                placeholder="Defaults to meta title if empty"
              />
            </div>
            <div>
              <label className={labelClass}>OG description</label>
              <textarea
                className={fieldClass}
                rows={3}
                value={blogForm.ogDescription}
                onChange={(e) => setBlogForm((f) => ({ ...f, ogDescription: e.target.value }))}
                placeholder="Defaults to meta description if empty"
              />
            </div>
            <div>
              <label className={labelClass}>OG image</label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex min-h-[9rem] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-violet-300 bg-violet-50/50 px-3 py-6 text-center text-sm font-medium text-violet-950 transition hover:border-violet-400 dark:border-violet-800 dark:bg-violet-950/25 dark:text-violet-100">
                  {uploading ? 'Uploading…' : 'Drag & drop or upload'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading || !onUploadOg}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !onUploadOg) return;
                      await onUploadOg(file);
                      e.target.value = '';
                    }}
                  />
                </label>
                <div className={`flex items-center justify-center overflow-hidden ${dashboardNestedCardClass} !p-0`}>
                  {blogForm.ogImage?.trim() ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={blogForm.ogImage}
                      alt=""
                      className="max-h-40 w-full object-cover"
                    />
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-400">No OG image yet</div>
                  )}
                </div>
              </div>
              <input
                className={`${fieldClass} mt-2`}
                value={blogForm.ogImage}
                onChange={(e) => setBlogForm((f) => ({ ...f, ogImage: e.target.value }))}
                placeholder="Or paste image URL"
              />
            </div>
          </div>
          <SocialFacebookPreview
            ogTitle={blogForm.ogTitle}
            ogDescription={blogForm.ogDescription}
            ogImage={blogForm.ogImage}
            fallbackTitle={blogForm.metaTitle || blogForm.title}
            fallbackDescription={blogForm.metaDescription || blogForm.excerpt}
            fallbackImage={blogForm.featuredImage}
            domain={previewDomain}
          />
          <p className="lg:col-span-2 text-xs text-slate-500 dark:text-slate-400">
            Twitter / X cards use the same Open Graph title, description, and image unless your front-end overrides them.
          </p>
        </div>
      </EditorSection>

      <EditorSection
        sectionNumber={4}
        title="Media"
        subtitle="Featured image, gallery, and embedded video."
        accent="amber"
        icon={<ImageIcon className="h-5 w-5" strokeWidth={2} aria-hidden />}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 lg:col-span-2">
            <label className={labelClass}>Featured image</label>
            <div className={`overflow-hidden ${dashboardNestedCardClass}`}>
              {blogForm.featuredImage?.trim() ? (
                <div className="relative max-h-[min(52vh,420px)] w-full bg-slate-50 dark:bg-slate-800/50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={blogForm.featuredImage}
                    alt={blogForm.featuredImageAlt?.trim() || blogForm.title?.trim() || 'Featured'}
                    className="mx-auto max-h-[min(52vh,420px)] w-full object-contain"
                  />
                  <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-white/95 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/95">
                    <label className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
                      Change image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          await onUploadFeatured(file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
                      onClick={() => setBlogForm((f) => ({ ...f, featuredImage: '' }))}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex min-h-[12rem] cursor-pointer flex-col items-center justify-center gap-2 px-4 py-10 text-center">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Upload featured image</span>
                  <span className="text-xs text-slate-500">PNG, JPG, or WebP — stored as WebP in the media library</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      await onUploadFeatured(file);
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
            </div>
          </div>
          <div>
            <label className={labelClass}>Alt text</label>
            <input
              className={`${fieldClass} rounded-lg`}
              value={blogForm.featuredImageAlt}
              onChange={(e) => setBlogForm((f) => ({ ...f, featuredImageAlt: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass}>Title</label>
            <input
              className={`${fieldClass} rounded-lg`}
              value={blogForm.breadcrumbTitle}
              onChange={(e) => setBlogForm((f) => ({ ...f, breadcrumbTitle: e.target.value }))}
              placeholder="Image title"
            />
          </div>
          <div>
            <label className={labelClass}>Caption</label>
            <input
              className={`${fieldClass} rounded-lg`}
              value={outboundMediaExtras.featuredCaption}
              onChange={(e) => mergeOutboundPatch({ featuredCaption: e.target.value })}
              placeholder="Optional caption"
            />
          </div>
          <div>
            <label className={labelClass}>Description (backend only)</label>
            <textarea
              className={`${fieldClass} rounded-lg`}
              rows={2}
              value={outboundMediaExtras.featuredDescriptionBackend}
              onChange={(e) => mergeOutboundPatch({ featuredDescriptionBackend: e.target.value })}
              placeholder="Internal / structured description"
            />
          </div>
          <div className="lg:col-span-2">
            <label className={labelClass}>Featured image URL (advanced)</label>
            <input
              className={`${fieldClass} rounded-lg font-mono text-[13px]`}
              value={blogForm.featuredImage}
              onChange={(e) => setBlogForm((f) => ({ ...f, featuredImage: e.target.value }))}
            />
          </div>

          <div className="lg:col-span-2">
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <label className={labelClass + ' mb-0'}>Additional images</label>
              <span className="text-[11px] font-semibold tabular-nums text-slate-600 dark:text-slate-300">
                {galleryUrls.length}/{MAX_GALLERY_ITEMS}
              </span>
            </div>
            <p className="mb-2 text-[11px] text-slate-500 dark:text-slate-400">
              Up to {MAX_GALLERY_ITEMS} images — URLs stored in <span className="font-mono">galleryImageUrls</span>.
            </p>
            <div className="mb-2 flex flex-wrap gap-2">
              <label
                className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-950 shadow-sm transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-900/50 dark:bg-amber-950/35 dark:text-amber-100 dark:hover:bg-amber-950/55`}
              >
                Add image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={
                    uploading ||
                    galleryUrls.length >= MAX_GALLERY_ITEMS ||
                    typeof onAppendGalleryImage !== 'function'
                  }
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !onAppendGalleryImage) return;
                    await onAppendGalleryImage(file);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
            <textarea
              className={`${fieldClass} rounded-lg`}
              rows={3}
              value={blogForm.galleryImageUrls}
              onChange={(e) => setBlogForm((f) => ({ ...f, galleryImageUrls: e.target.value }))}
              placeholder="https://…"
            />
            {galleryUrls.length > 0 ? (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-5">
                {galleryUrls.slice(0, MAX_GALLERY_ITEMS).map((url) => (
                  <div key={url} className={`group relative overflow-hidden rounded-lg ${dashboardNestedCardClass} !p-0`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="aspect-square w-full object-cover" />
                    <button
                      type="button"
                      title="Remove from list"
                      onClick={() => removeGalleryUrl(url)}
                      className="absolute right-1 top-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-2">
            <label className={labelClass}>Video (YouTube)</label>
            <input
              className={fieldClass}
              value={blogForm.embeddedVideoUrl}
              onChange={(e) => setBlogForm((f) => ({ ...f, embeddedVideoUrl: e.target.value }))}
              placeholder="https://www.youtube.com/watch?v=…"
            />
            {youtubePreview ? (
              <div className={`mt-3 overflow-hidden ${dashboardNestedCardClass} !p-0`}>
                <div className="aspect-video w-full bg-black">
                  <iframe
                    title="YouTube preview"
                    src={youtubePreview}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </EditorSection>

      <EditorSection
        sectionNumber={5}
        title="Advertisement & category ads"
        subtitle="Banner placement and optional category targeting."
        accent="rose"
        icon={<Megaphone className="h-5 w-5" strokeWidth={2} aria-hidden />}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <label className={labelClass}>Ad position</label>
            <select
              className={fieldClass}
              value={blogForm.subCategory || ''}
              onChange={(e) => setBlogForm((f) => ({ ...f, subCategory: e.target.value }))}
            >
              <option value="">Select…</option>
              {AD_POSITIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Ad type</label>
            <select
              className={fieldClass}
              value={adTypeFromOutbound}
              onChange={(e) => mergeOutboundPatch({ adType: e.target.value })}
            >
              <option value="">Select…</option>
              {AD_TYPES.map((t) => (
                <option key={t} value={t.toLowerCase()}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className={labelClass}>Ad size</label>
            <select
              className={fieldClass}
              value={adSizeFromOutbound}
              onChange={(e) => mergeOutboundPatch({ adSize: e.target.value })}
            >
              <option value="">Select…</option>
              {AD_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-500">
              Stored with other link metadata in <span className="font-mono">outboundLinksJson</span> when set.
            </p>
          </div>
          <div className="lg:col-span-2">
            <label className={labelClass}>Category</label>
            <select
              className={`${fieldClass} rounded-lg`}
              value={adCategoryFromOutbound}
              onChange={(e) => mergeOutboundPatch({ adCategory: e.target.value })}
            >
              <option value="">Select…</option>
              {AD_CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className={labelClass}>Redirect URL</label>
            <input
              className={fieldClass}
              value={(() => {
                try {
                  const raw = blogForm.outboundLinksJson.trim();
                  if (!raw) return '';
                  const j = JSON.parse(raw);
                  return typeof j?.redirect === 'string' ? j.redirect : '';
                } catch {
                  return '';
                }
              })()}
              onChange={(e) => mergeOutboundPatch({ redirect: e.target.value })}
              placeholder="https://…"
            />
          </div>
          <div className="lg:col-span-2">
            <label className={labelClass}>Banner image</label>
            <div className={`overflow-hidden ${dashboardNestedCardClass}`}>
              {blogForm.bannerImage?.trim() ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={blogForm.bannerImage}
                    alt=""
                    className="max-h-48 w-full object-cover object-center"
                  />
                  <div className="flex flex-wrap gap-2 border-t border-slate-100 px-3 py-2 dark:border-slate-700">
                    {onUploadBanner ? (
                      <label className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold shadow-sm dark:border-slate-600 dark:bg-slate-800">
                        Change banner
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploading}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            await onUploadBanner(file);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    ) : null}
                    <button
                      type="button"
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800"
                      onClick={() => setBlogForm((f) => ({ ...f, bannerImage: '' }))}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex min-h-[8rem] cursor-pointer flex-col items-center justify-center gap-2 py-8">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Upload banner</span>
                  {onUploadBanner ? (
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        await onUploadBanner(file);
                        e.target.value = '';
                      }}
                    />
                  ) : null}
                </label>
              )}
            </div>
            <input
              className={`${fieldClass} mt-2`}
              value={blogForm.bannerImage}
              onChange={(e) => setBlogForm((f) => ({ ...f, bannerImage: e.target.value }))}
              placeholder="Or paste banner URL"
            />
          </div>

          <div className="lg:col-span-2">
            <div className={`flex flex-col gap-3 sm:flex-row ${dashboardNestedCardClass}`}>
              <div className="min-h-[120px] flex-[2] rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 dark:border-slate-600 dark:bg-slate-800/40 dark:text-slate-400">
                <p className="font-semibold text-slate-700 dark:text-slate-200">Article content area</p>
                <p className="mt-6 rounded border border-amber-200 bg-amber-50 px-2 py-3 text-center text-[11px] font-medium text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
                  Ad preview · {blogForm.subCategory ? AD_POSITIONS.find((x) => x.value === blogForm.subCategory)?.label ?? blogForm.subCategory : 'position not set'}
                </p>
              </div>
              <div className="flex flex-1 flex-col justify-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <p>
                  Wireframe only — actual placement depends on the public news template. Position is saved as{' '}
                  <span className="font-mono">subCategory</span>.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <label className={labelClass}>Category ads</label>
            <p className="mb-2 text-[11px] text-slate-500 dark:text-slate-400">
              Choose where this ad should appear. Slugs are saved in <span className="font-mono">categorySlugs</span>{' '}
              (comma-separated).
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {CATEGORY_AD_TOPICS.map((t) => {
                const selected = blogForm.categorySlugs
                  .split(',')
                  .map((x) => x.trim())
                  .includes(t.slug);
                return (
                  <label
                    key={t.slug}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600"
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(e) => toggleCategorySlug(t.slug, e.target.checked)}
                      className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                    />
                    <span>{t.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </EditorSection>

      <EditorSection
        sectionNumber={6}
        title="Preview & publish"
        subtitle="Google SERP preview and internal notes."
        accent="violet"
        icon={<LayoutTemplate className="h-5 w-5" strokeWidth={2} aria-hidden />}
      >
        <div className="space-y-4">
          <GoogleSnippetPreview
            title={blogForm.metaTitle || blogForm.title}
            description={blogForm.metaDescription}
            url={publicArticleUrl}
            ogImage={blogForm.featuredImage}
          />
          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <label className={labelClass + ' mb-0'}>Team notes (internal)</label>
              <span className="text-[11px] font-medium tabular-nums text-slate-500 dark:text-slate-400">
                {teamNoteLen} / 2000
              </span>
            </div>
            <textarea
              className={`${fieldClass} rounded-lg`}
              rows={3}
              value={blogForm.seoNote}
              onChange={(e) => setBlogForm((f) => ({ ...f, seoNote: e.target.value }))}
              placeholder="Not visible on the public site — appears in activity logs when provided."
            />
          </div>
        </div>
      </EditorSection>

      <div className={`flex gap-2 px-1 py-2 text-xs text-slate-600 dark:text-slate-400`}>
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" aria-hidden />
        <p>
          Public <span className="font-mono">/news</span> shows this English article for all languages. Per-locale
          article translation and alternate article URLs are disabled.
        </p>
      </div>
    </div>
  );
});
