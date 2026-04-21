'use client';

import { useEffect, useImperativeHandle, useState, forwardRef, useMemo } from 'react';
import FeatureGate from '@/components/FeatureGate';
import type { TranslationPatch } from '@/lib/marketer-news-fields';
import {
  BLOG_LOCALES_FOR_TRANSLATIONS,
  type BlogFormState,
  type BlogListRow,
} from '@/lib/marketer-blog-form';

type SectorOption = { id: string; name: string; slug: string };

type LocDraft = {
  title: string;
  content: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  translatedSlug: string;
  hreflangJson: string;
};

const emptyLoc = (): LocDraft => ({
  title: '',
  content: '',
  excerpt: '',
  metaTitle: '',
  metaDescription: '',
  translatedSlug: '',
  hreflangJson: '',
});

export type MarketerBlogFieldsHandle = {
  getTranslationPatches: () => TranslationPatch[];
};

type Props = {
  blogForm: BlogFormState;
  setBlogForm: React.Dispatch<React.SetStateAction<BlogFormState>>;
  sectors: SectorOption[];
  sectorsLoading: boolean;
  blogs: BlogListRow[];
  authorLabel: string;
  uploading: boolean;
  activeBlog: BlogListRow | null;
  onUploadFeatured: (file: File) => Promise<void>;
};

const fieldClass = 'rounded-lg border border-slate-300 px-3 py-2 text-sm w-full';
const labelClass = 'block text-xs font-medium text-slate-600 mb-1';

export const MarketerBlogFields = forwardRef<MarketerBlogFieldsHandle, Props>(function MarketerBlogFields(
  { blogForm, setBlogForm, sectors, sectorsLoading, blogs, authorLabel, uploading, activeBlog, onUploadFeatured }: Props,
  ref,
) {
  const [locDrafts, setLocDrafts] = useState<Record<string, LocDraft>>({});

  useEffect(() => {
    const next: Record<string, LocDraft> = {};
    for (const loc of BLOG_LOCALES_FOR_TRANSLATIONS) {
      const row = activeBlog?.translations?.find((t) => t.locale === loc);
      next[loc] = row
        ? {
            title: row.title ?? '',
            content: row.content ?? '',
            excerpt: row.excerpt ?? '',
            metaTitle: row.metaTitle ?? '',
            metaDescription: row.metaDescription ?? '',
            translatedSlug: row.translatedSlug ?? '',
            hreflangJson: row.hreflangJson ?? '',
          }
        : emptyLoc();
    }
    setLocDrafts(next);
    // Depend on `activeBlog`, not only `id`, so a lazy-loaded row (list omits bodies) still
    // hydrates translation tabs after `GET /api/marketer/news/[slug]` merges full content.
  }, [activeBlog]);

  const relatedOptions = useMemo(
    () => blogs.filter((b) => b.slug && b.slug !== blogForm.slug).map((b) => ({ slug: b.slug, title: b.title })),
    [blogs, blogForm.slug],
  );

  useImperativeHandle(ref, () => ({
    getTranslationPatches: () => {
      const patches: TranslationPatch[] = [];
      for (const loc of BLOG_LOCALES_FOR_TRANSLATIONS) {
        const d = locDrafts[loc] ?? emptyLoc();
        const has =
          d.title.trim() ||
          d.content.trim() ||
          d.excerpt.trim() ||
          d.metaTitle.trim() ||
          d.metaDescription.trim() ||
          d.translatedSlug.trim() ||
          d.hreflangJson.trim();
        if (!has) continue;
        patches.push({
          locale: loc,
          title: d.title.trim() || undefined,
          content: d.content.trim() || undefined,
          excerpt: d.excerpt.trim() || null,
          metaTitle: d.metaTitle.trim() || null,
          metaDescription: d.metaDescription.trim() || null,
          translatedSlug: d.translatedSlug.trim() || null,
          hreflangJson: d.hreflangJson.trim() || null,
        });
      }
      return patches;
    },
  }));

  function setLoc(loc: string, partial: Partial<LocDraft>) {
    setLocDrafts((prev) => ({ ...prev, [loc]: { ...(prev[loc] ?? emptyLoc()), ...partial } }));
  }

  return (
    <div className="space-y-4">
      <details open className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
        <summary className="cursor-pointer text-sm font-semibold text-slate-800 dark:text-slate-100">
          1. Core content & author
        </summary>
        <div className="mt-3 grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className={labelClass}>Title</label>
            <input
              className={fieldClass}
              value={blogForm.title}
              onChange={(e) => setBlogForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Post title"
            />
          </div>
          <div>
            <label className={labelClass}>Slug (URL)</label>
            <input
              className={fieldClass}
              value={blogForm.slug}
              onChange={(e) => setBlogForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="best-seo-tools-2026"
            />
          </div>
          <div>
            <label className={labelClass}>Sector</label>
            <select
              className={fieldClass}
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
            <label className={labelClass}>Short description / excerpt</label>
            <textarea
              className={fieldClass}
              rows={3}
              value={blogForm.excerpt}
              onChange={(e) => setBlogForm((f) => ({ ...f, excerpt: e.target.value }))}
              placeholder="Card and SERP-friendly summary"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Full content (HTML or markdown)</label>
            <textarea
              className={fieldClass}
              rows={10}
              value={blogForm.content}
              onChange={(e) => setBlogForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Article body"
            />
          </div>
          <div>
            <label className={labelClass}>Author (account)</label>
            <input className={fieldClass} value={authorLabel} disabled placeholder="Author" />
          </div>
          <div>
            <label className={labelClass}>Author display name (byline override)</label>
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
      </details>

      <details className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
        <summary className="cursor-pointer text-sm font-semibold text-slate-800 dark:text-slate-100">
          2. Publishing & status
        </summary>
        <div className="mt-3 grid sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Status</label>
            <select
              className={fieldClass}
              value={blogForm.status}
              onChange={(e) =>
                setBlogForm((f) => ({
                  ...f,
                  status: e.target.value as BlogFormState['status'],
                  publishedAt: e.target.value === 'published' ? f.publishedAt : '',
                }))
              }
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Publish date (when published)</label>
            <input
              type="date"
              className={fieldClass}
              value={blogForm.publishedAt}
              onChange={(e) => setBlogForm((f) => ({ ...f, publishedAt: e.target.value }))}
              disabled={blogForm.status !== 'published'}
            />
          </div>
          <FeatureGate feature="scheduling">
            <div className="sm:col-span-2">
              <label className={labelClass}>Schedule publish (datetime)</label>
              <input
                type="datetime-local"
                className={fieldClass}
                value={blogForm.scheduledPublishAt}
                onChange={(e) => setBlogForm((f) => ({ ...f, scheduledPublishAt: e.target.value }))}
              />
              <p className="text-xs text-slate-500 mt-1">
                For <strong>Scheduled</strong> status, set a future time. Cron promotes due posts to published.
              </p>
            </div>
          </FeatureGate>
          <div>
            <label className={labelClass}>Content type</label>
            <select
              className={fieldClass}
              value={blogForm.contentType}
              onChange={(e) =>
                setBlogForm((f) => ({ ...f, contentType: e.target.value as BlogFormState['contentType'] }))
              }
            >
              <option value="blog">Blog</option>
              <option value="case_study">Case study</option>
              <option value="news">News</option>
              <option value="guide">Guide</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Sub-category (optional)</label>
            <input
              className={fieldClass}
              value={blogForm.subCategory}
              onChange={(e) => setBlogForm((f) => ({ ...f, subCategory: e.target.value }))}
              placeholder="e.g. logistics"
            />
          </div>
          <div>
            <label className={labelClass}>Categories (comma-separated slugs)</label>
            <input
              className={fieldClass}
              value={blogForm.categorySlugs}
              onChange={(e) => setBlogForm((f) => ({ ...f, categorySlugs: e.target.value }))}
              placeholder="sector-news, guides"
            />
          </div>
          <div>
            <label className={labelClass}>Tags (comma-separated)</label>
            <input
              className={fieldClass}
              value={blogForm.tags}
              onChange={(e) => setBlogForm((f) => ({ ...f, tags: e.target.value }))}
              placeholder="seo, marketing, 2026"
            />
          </div>
        </div>
      </details>

      <details className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
        <summary className="cursor-pointer text-sm font-semibold text-slate-800 dark:text-slate-100">
          3. SEO & URL
        </summary>
        <div className="mt-3 grid sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Meta title</label>
            <input
              className={fieldClass}
              value={blogForm.metaTitle}
              onChange={(e) => setBlogForm((f) => ({ ...f, metaTitle: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass}>Breadcrumb title</label>
            <input
              className={fieldClass}
              value={blogForm.breadcrumbTitle}
              onChange={(e) => setBlogForm((f) => ({ ...f, breadcrumbTitle: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Meta description</label>
            <textarea
              className={fieldClass}
              rows={3}
              value={blogForm.metaDescription}
              onChange={(e) => setBlogForm((f) => ({ ...f, metaDescription: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass}>Focus keyword</label>
            <input
              className={fieldClass}
              value={blogForm.focusKeyword}
              onChange={(e) => setBlogForm((f) => ({ ...f, focusKeyword: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass}>Secondary keywords (comma-separated)</label>
            <input
              className={fieldClass}
              value={blogForm.secondaryKeywords}
              onChange={(e) => setBlogForm((f) => ({ ...f, secondaryKeywords: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass}>Keywords (legacy / combined)</label>
            <input
              className={fieldClass}
              value={blogForm.keywords}
              onChange={(e) => setBlogForm((f) => ({ ...f, keywords: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass}>Canonical URL</label>
            <input
              className={fieldClass}
              value={blogForm.canonicalUrl}
              onChange={(e) => setBlogForm((f) => ({ ...f, canonicalUrl: e.target.value }))}
              placeholder="https://…"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Robots meta (e.g. index,follow or noindex,nofollow)</label>
            <input
              className={fieldClass}
              value={blogForm.metaRobots}
              onChange={(e) => setBlogForm((f) => ({ ...f, metaRobots: e.target.value }))}
              placeholder="index,follow"
            />
          </div>
        </div>
      </details>

      <details className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
        <summary className="cursor-pointer text-sm font-semibold text-slate-800 dark:text-slate-100">
          4. Media
        </summary>
        <div className="mt-3 grid sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Featured image URL</label>
            <input
              className={fieldClass}
              value={blogForm.featuredImage}
              onChange={(e) => setBlogForm((f) => ({ ...f, featuredImage: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass}>Featured image alt text</label>
            <input
              className={fieldClass}
              value={blogForm.featuredImageAlt}
              onChange={(e) => setBlogForm((f) => ({ ...f, featuredImageAlt: e.target.value }))}
            />
          </div>
          <label className="flex flex-col justify-end rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 cursor-pointer bg-white">
            {uploading ? 'Uploading…' : 'Upload featured image'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                await onUploadFeatured(file);
              }}
            />
          </label>
          <div>
            <label className={labelClass}>Banner image URL</label>
            <input
              className={fieldClass}
              value={blogForm.bannerImage}
              onChange={(e) => setBlogForm((f) => ({ ...f, bannerImage: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Gallery image URLs (JSON array of strings)</label>
            <textarea
              className={fieldClass}
              rows={2}
              value={blogForm.galleryImageUrls}
              onChange={(e) => setBlogForm((f) => ({ ...f, galleryImageUrls: e.target.value }))}
              placeholder='["/api/media/…","/api/media/…"]'
            />
          </div>
          <div>
            <label className={labelClass}>Embedded video URL</label>
            <input
              className={fieldClass}
              value={blogForm.embeddedVideoUrl}
              onChange={(e) => setBlogForm((f) => ({ ...f, embeddedVideoUrl: e.target.value }))}
              placeholder="https://www.youtube.com/watch?v=…"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Infographics URLs (JSON array)</label>
            <textarea
              className={fieldClass}
              rows={2}
              value={blogForm.infographicUrls}
              onChange={(e) => setBlogForm((f) => ({ ...f, infographicUrls: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass}>OG title</label>
            <input
              className={fieldClass}
              value={blogForm.ogTitle}
              onChange={(e) => setBlogForm((f) => ({ ...f, ogTitle: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass}>OG image URL</label>
            <input
              className={fieldClass}
              value={blogForm.ogImage}
              onChange={(e) => setBlogForm((f) => ({ ...f, ogImage: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>OG description</label>
            <textarea
              className={fieldClass}
              rows={2}
              value={blogForm.ogDescription}
              onChange={(e) => setBlogForm((f) => ({ ...f, ogDescription: e.target.value }))}
            />
          </div>
        </div>
      </details>

      <details className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
        <summary className="cursor-pointer text-sm font-semibold text-slate-800 dark:text-slate-100">
          5. Engagement & analytics (manual counts)
        </summary>
        <div className="mt-3 grid sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Views</label>
            <input
              className={fieldClass}
              inputMode="numeric"
              value={blogForm.viewCount}
              onChange={(e) => setBlogForm((f) => ({ ...f, viewCount: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass}>Likes / claps</label>
            <input
              className={fieldClass}
              inputMode="numeric"
              value={blogForm.likeCount}
              onChange={(e) => setBlogForm((f) => ({ ...f, likeCount: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass}>Shares</label>
            <input
              className={fieldClass}
              inputMode="numeric"
              value={blogForm.shareCount}
              onChange={(e) => setBlogForm((f) => ({ ...f, shareCount: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass}>Reading time (minutes, optional override)</label>
            <input
              className={fieldClass}
              inputMode="numeric"
              value={blogForm.readingTimeMinutes}
              onChange={(e) => setBlogForm((f) => ({ ...f, readingTimeMinutes: e.target.value }))}
              placeholder="Auto from content if empty on save"
            />
          </div>
          <div className="sm:col-span-2 flex items-center gap-2">
            <input
              id="comments-enabled"
              type="checkbox"
              checked={blogForm.commentsEnabled}
              onChange={(e) => setBlogForm((f) => ({ ...f, commentsEnabled: e.target.checked }))}
            />
            <label htmlFor="comments-enabled" className="text-sm text-slate-700">
              Comments enabled
            </label>
          </div>
          <p className="text-xs text-slate-500 sm:col-span-2">
            Scroll depth and automated view increments can be wired to analytics separately; this form stores editable
            counters for campaigns.
          </p>
        </div>
      </details>

      <details className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
        <summary className="cursor-pointer text-sm font-semibold text-slate-800 dark:text-slate-100">
          6. Schema JSON-LD & linking
        </summary>
        <div className="mt-3 grid gap-3">
          <div>
            <label className={labelClass}>Article schema (JSON-LD)</label>
            <textarea
              className={fieldClass}
              rows={4}
              value={blogForm.articleSchemaJson}
              onChange={(e) => setBlogForm((f) => ({ ...f, articleSchemaJson: e.target.value }))}
              placeholder='{"@context":"https://schema.org",...}'
            />
          </div>
          <div>
            <label className={labelClass}>FAQ schema (JSON-LD)</label>
            <textarea
              className={fieldClass}
              rows={3}
              value={blogForm.faqSchemaJson}
              onChange={(e) => setBlogForm((f) => ({ ...f, faqSchemaJson: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass}>How-To schema (JSON-LD)</label>
            <textarea
              className={fieldClass}
              rows={3}
              value={blogForm.howToSchemaJson}
              onChange={(e) => setBlogForm((f) => ({ ...f, howToSchemaJson: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass}>Related posts (comma-separated slugs)</label>
            <input
              className={fieldClass}
              value={blogForm.relatedPostSlugs}
              onChange={(e) => setBlogForm((f) => ({ ...f, relatedPostSlugs: e.target.value }))}
              placeholder="slug-one, slug-two"
            />
            <p className="text-xs text-slate-500 mt-1">Known slugs: {relatedOptions.map((o) => o.slug).join(', ') || '—'}</p>
          </div>
          <div>
            <label className={labelClass}>Pillar content slug</label>
            <input
              className={fieldClass}
              value={blogForm.pillarSlug}
              onChange={(e) => setBlogForm((f) => ({ ...f, pillarSlug: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass}>Outbound links JSON</label>
            <textarea
              className={fieldClass}
              rows={3}
              value={blogForm.outboundLinksJson}
              onChange={(e) => setBlogForm((f) => ({ ...f, outboundLinksJson: e.target.value }))}
              placeholder='[{"url":"https://…","label":"Source","nofollow":true}]'
            />
          </div>
        </div>
      </details>

      <details className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
        <summary className="cursor-pointer text-sm font-semibold text-slate-800 dark:text-slate-100">
          7. Translations (non-English locales)
        </summary>
        <p className="text-xs text-slate-500 mt-2 mb-3">
          Auto-translation still runs from English on publish. Edit overrides here (hreflang JSON for alternate URLs).
        </p>
        <div className="space-y-4">
          {BLOG_LOCALES_FOR_TRANSLATIONS.map((loc) => (
            <div key={loc} className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-600 dark:bg-slate-950/40">
              <p className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">{loc}</p>
              <div className="grid sm:grid-cols-2 gap-2">
                <input
                  className={fieldClass}
                  placeholder="Translated title"
                  value={locDrafts[loc]?.title ?? ''}
                  onChange={(e) => setLoc(loc, { title: e.target.value })}
                />
                <input
                  className={fieldClass}
                  placeholder="Translated slug (optional)"
                  value={locDrafts[loc]?.translatedSlug ?? ''}
                  onChange={(e) => setLoc(loc, { translatedSlug: e.target.value })}
                />
                <textarea
                  className={`${fieldClass} sm:col-span-2`}
                  rows={3}
                  placeholder="Translated excerpt"
                  value={locDrafts[loc]?.excerpt ?? ''}
                  onChange={(e) => setLoc(loc, { excerpt: e.target.value })}
                />
                <textarea
                  className={`${fieldClass} sm:col-span-2`}
                  rows={5}
                  placeholder="Translated HTML content"
                  value={locDrafts[loc]?.content ?? ''}
                  onChange={(e) => setLoc(loc, { content: e.target.value })}
                />
                <input
                  className={fieldClass}
                  placeholder="Meta title"
                  value={locDrafts[loc]?.metaTitle ?? ''}
                  onChange={(e) => setLoc(loc, { metaTitle: e.target.value })}
                />
                <input
                  className={fieldClass}
                  placeholder="Meta description"
                  value={locDrafts[loc]?.metaDescription ?? ''}
                  onChange={(e) => setLoc(loc, { metaDescription: e.target.value })}
                />
                <textarea
                  className={`${fieldClass} sm:col-span-2`}
                  rows={2}
                  placeholder='Hreflang / alternates JSON e.g. {"en":"https://…","te":"https://…"}'
                  value={locDrafts[loc]?.hreflangJson ?? ''}
                  onChange={(e) => setLoc(loc, { hreflangJson: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
      </details>

      <div>
        <label className={labelClass}>Team note (activity log only)</label>
        <input
          className={fieldClass}
          value={blogForm.seoNote}
          onChange={(e) => setBlogForm((f) => ({ ...f, seoNote: e.target.value }))}
        />
      </div>
    </div>
  );
});
