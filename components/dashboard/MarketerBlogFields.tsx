'use client';

import { useEffect, useImperativeHandle, useState, forwardRef } from 'react';
import type { TranslationPatch } from '@/lib/marketer-news-fields';
import {
  BLOG_LOCALES_FOR_TRANSLATIONS,
  type BlogFormState,
  type BlogListRow,
} from '@/lib/marketer-blog-form';
import { Loader2 } from 'lucide-react';
import { BlogRichContentField } from '@/components/dashboard/BlogRichContentField';

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

/** Partial locale drafts returned from `POST /api/marketer/news/translate-fields` for create mode. */
export type TranslationDraftHydration = Record<string, Partial<LocDraft>>;

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
  /** Saved post in edit mode (slug exists in the database). */
  autoTranslateEligible?: boolean;
  autoTranslateRunning?: boolean;
  /** True while save/create/delete is in progress — translation button waits. */
  autoTranslateBlocked?: boolean;
  /** Machine-translate from English into te, hi, es and refresh translation fields. */
  onAutoTranslateLocales?: () => Promise<void>;
};

const fieldClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500';
const labelClass =
  'mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400';
const detailsShell =
  'overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950/50';
const summaryBtn =
  'cursor-pointer list-none bg-slate-50/95 px-4 py-3 text-sm font-semibold text-slate-800 transition marker:content-none hover:bg-slate-100 dark:bg-slate-800/50 dark:text-slate-100 dark:hover:bg-slate-800 [&::-webkit-details-marker]:hidden';

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
    autoTranslateEligible = false,
    autoTranslateRunning = false,
    autoTranslateBlocked = false,
    onAutoTranslateLocales,
  }: Props,
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
    hydrateTranslationDrafts: (byLocale: TranslationDraftHydration) => {
      setLocDrafts((prev) => {
        const next = { ...prev };
        for (const loc of Object.keys(byLocale)) {
          next[loc] = { ...(next[loc] ?? emptyLoc()), ...byLocale[loc] };
        }
        return next;
      });
    },
  }));

  function setLoc(loc: string, partial: Partial<LocDraft>) {
    setLocDrafts((prev) => ({ ...prev, [loc]: { ...(prev[loc] ?? emptyLoc()), ...partial } }));
  }

  return (
    <div className="space-y-4">
      <details open className={detailsShell}>
        <summary className={summaryBtn}>1. Core content & author</summary>
        <div className="grid gap-3 border-t border-slate-100 p-4 dark:border-slate-800 sm:grid-cols-2">
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
          <BlogRichContentField
            instanceKey={`blog-main-${activeBlog?.id ?? 'new'}`}
            label="Full article (formatted)"
            value={blogForm.content}
            onChange={(content) => setBlogForm((f) => ({ ...f, content }))}
            placeholder="Write and format your article — bold, headings, lists, and alignment work like Word."
            minHeightClass="min-h-[26rem] sm:min-h-[30rem]"
          />
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

      <details className={detailsShell}>
        <summary className={summaryBtn}>
          2. SEO & URL
        </summary>
        <div className="grid gap-3 border-t border-slate-100 p-4 dark:border-slate-800 sm:grid-cols-2">
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

      <details className={detailsShell}>
        <summary className={summaryBtn}>
          3. Media
        </summary>
        <div className="grid gap-3 border-t border-slate-100 p-4 dark:border-slate-800 sm:grid-cols-2">
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
          <label className="flex cursor-pointer flex-col justify-end rounded-xl border border-dashed border-violet-300 bg-violet-50/50 px-3 py-3 text-center text-sm font-medium text-violet-900 transition hover:border-violet-400 hover:bg-violet-50 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-200 dark:hover:border-violet-600">
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
                e.target.value = '';
              }}
            />
          </label>
          {blogForm.featuredImage?.trim() ? (
            <div className="sm:col-span-2">
              <p className={labelClass}>Featured preview (full image, not cropped)</p>
              <div className="flex max-h-[min(72vh,600px)] w-full items-center justify-center overflow-auto rounded-xl border border-slate-200 bg-slate-50/90 p-2 dark:border-slate-600 dark:bg-slate-900/60">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={blogForm.featuredImage}
                  alt={blogForm.featuredImageAlt?.trim() || blogForm.title?.trim() || 'Featured image'}
                  className="h-auto max-h-[min(72vh,600px)] w-full max-w-full object-contain object-center"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                Uploads are converted to <span className="font-mono">.webp</span> and stored in the database
                (media library). In edit mode the post is updated automatically after upload.
              </p>
            </div>
          ) : null}
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

      <details className={detailsShell}>
        <summary className={summaryBtn}>
          4. Translations (non-English locales)
        </summary>
        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
            Machine translation uses your English (default) title, excerpt, meta fields, and article body. Saving a
            published post re-syncs all locales before the response. Visitors in{' '}
            <span className="font-mono">{BLOG_LOCALES_FOR_TRANSLATIONS.join(', ')}</span> see these rows when the post
            is published.
          </p>
          {onAutoTranslateLocales ? (
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <button
                type="button"
                onClick={() => void onAutoTranslateLocales()}
                disabled={
                  !autoTranslateEligible || autoTranslateRunning || autoTranslateBlocked
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-300 bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-violet-700 dark:bg-violet-700 dark:hover:bg-violet-600"
              >
                {autoTranslateRunning ? <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden /> : null}
                Translate languages
              </button>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {!autoTranslateEligible
                  ? 'Add English title and body first (new post), or open an existing post with Edit.'
                  : autoTranslateBlocked
                    ? 'Wait for save or delete to finish.'
                    : autoTranslateRunning
                      ? 'Translating… locales run in parallel; large posts may still take several seconds.'
                      : 'Uses MyMemory from English. You can still edit any locale below afterward.'}
              </p>
            </div>
          ) : null}
          <div className="space-y-4">
            {BLOG_LOCALES_FOR_TRANSLATIONS.map((loc) => (
              <div
                key={loc}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-600 dark:bg-slate-950/40"
              >
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                  {loc}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
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
                <div className="sm:col-span-2">
                  <BlogRichContentField
                    instanceKey={`blog-loc-${activeBlog?.id ?? 'new'}-${loc}`}
                    label="Article body (formatted)"
                    embedded
                    showHint={false}
                    value={locDrafts[loc]?.content ?? ''}
                    onChange={(content) => setLoc(loc, { content })}
                    placeholder="Translated article — same editor as English."
                    minHeightClass="min-h-[16rem] sm:min-h-[22rem]"
                  />
                </div>
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
        </div>
      </details>

      <div className="rounded-xl border border-slate-200 bg-violet-50/30 p-4 dark:border-slate-700 dark:bg-violet-950/20">
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
