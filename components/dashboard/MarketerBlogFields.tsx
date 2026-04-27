'use client';

import { useImperativeHandle, forwardRef } from 'react';
import type { TranslationPatch } from '@/lib/marketer-news-fields';
import type { BlogFormState, BlogListRow } from '@/lib/marketer-blog-form';
import { BlogRichContentField } from '@/components/dashboard/BlogRichContentField';
import { dashboardInputClass, dashboardNestedCardClass } from '@/lib/dashboard-ui';

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
};

const fieldClass = dashboardInputClass;
const labelClass =
  'mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400';
const detailsShell = `overflow-hidden !p-0 ${dashboardNestedCardClass}`;
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
  }: Props,
  ref,
) {
  useImperativeHandle(ref, () => ({
    getTranslationPatches: (): TranslationPatch[] => [],
    hydrateTranslationDrafts: (_byLocale: TranslationDraftHydration) => {
      /* no-op: /news is English-only */
    },
  }));

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
              <div className={`flex max-h-[min(72vh,600px)] w-full items-center justify-center overflow-auto p-2 ${dashboardNestedCardClass}`}>
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

      <p className={`px-3 py-2.5 text-xs text-slate-600 dark:text-slate-400 ${dashboardNestedCardClass}`}>
        Public <span className="font-mono">/news</span> shows this English article for all languages. Per-locale
        article translation and alternate article URLs are disabled.
      </p>

      <div className={`bg-violet-50/30 p-4 dark:bg-violet-950/20 ${dashboardNestedCardClass}`}>
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
