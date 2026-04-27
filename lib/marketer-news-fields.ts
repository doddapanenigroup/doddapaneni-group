import type { Prisma } from '@/lib/prisma-generated';
import { normalizeStoredNewsSlug } from '@/lib/news-slug-normalize';

function strOrNull(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t.length ? t : null;
}

function intOrNull(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === 'string' && v.trim()) {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

const NEWS_STATUSES = ['draft', 'published', 'scheduled', 'archived'] as const;
export type NewsStatusPayload = (typeof NEWS_STATUSES)[number];

export function parseNewsStatus(v: unknown): NewsStatusPayload | undefined {
  if (typeof v !== 'string') return undefined;
  return (NEWS_STATUSES as readonly string[]).includes(v) ? (v as NewsStatusPayload) : undefined;
}

const CONTENT_TYPES = ['blog', 'case_study', 'news', 'guide'] as const;
export type NewsContentTypePayload = (typeof CONTENT_TYPES)[number];

export function parseContentType(v: unknown): NewsContentTypePayload | undefined {
  if (typeof v !== 'string') return undefined;
  return (CONTENT_TYPES as readonly string[]).includes(v) ? (v as NewsContentTypePayload) : undefined;
}

/** ~200 wpm from HTML-ish body */
export function estimateReadingMinutesFromHtml(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/**
 * Maps marketer JSON body to Prisma `News` update data. Only includes keys that are present in `body`
 * (PATCH semantics) except `content` always recomputes reading time when `content` is sent.
 */
export function newsPatchDataFromBody(body: Record<string, unknown>): Prisma.NewsUpdateInput {
  const data: Prisma.NewsUpdateInput = {};

  if (typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim();
  if (typeof body.slug === 'string' && body.slug.trim()) {
    const n = normalizeStoredNewsSlug(body.slug);
    if (n) data.slug = n;
  }
  if (typeof body.content === 'string') {
    data.content = body.content;
    data.readingTimeMinutes = estimateReadingMinutesFromHtml(body.content);
  }
  if ('excerpt' in body) data.excerpt = strOrNull(body.excerpt);
  if ('featuredImage' in body) data.featuredImage = strOrNull(body.featuredImage);
  if ('featuredImageAlt' in body) data.featuredImageAlt = strOrNull(body.featuredImageAlt);
  if ('bannerImage' in body) data.bannerImage = strOrNull(body.bannerImage);
  if ('galleryImageUrls' in body) data.galleryImageUrls = strOrNull(body.galleryImageUrls);
  if ('embeddedVideoUrl' in body) data.embeddedVideoUrl = strOrNull(body.embeddedVideoUrl);
  if ('infographicUrls' in body) data.infographicUrls = strOrNull(body.infographicUrls);
  if ('authorDisplayName' in body) data.authorDisplayName = strOrNull(body.authorDisplayName);
  if ('authorBio' in body) data.authorBio = strOrNull(body.authorBio);
  if ('metaTitle' in body) data.metaTitle = strOrNull(body.metaTitle);
  if ('metaDescription' in body) data.metaDescription = strOrNull(body.metaDescription);
  if ('keywords' in body) data.keywords = strOrNull(body.keywords);
  if ('focusKeyword' in body) data.focusKeyword = strOrNull(body.focusKeyword);
  if ('secondaryKeywords' in body) data.secondaryKeywords = strOrNull(body.secondaryKeywords);
  if ('canonicalUrl' in body) data.canonicalUrl = strOrNull(body.canonicalUrl);
  if ('breadcrumbTitle' in body) data.breadcrumbTitle = strOrNull(body.breadcrumbTitle);
  if ('metaRobots' in body) data.metaRobots = strOrNull(body.metaRobots);
  if ('categorySlugs' in body) data.categorySlugs = strOrNull(body.categorySlugs);
  if ('tags' in body) data.tags = strOrNull(body.tags);
  if ('subCategory' in body) data.subCategory = strOrNull(body.subCategory);
  if ('ogTitle' in body) data.ogTitle = strOrNull(body.ogTitle);
  if ('ogDescription' in body) data.ogDescription = strOrNull(body.ogDescription);
  if ('ogImage' in body) data.ogImage = strOrNull(body.ogImage);
  if ('articleSchemaJson' in body) data.articleSchemaJson = strOrNull(body.articleSchemaJson);
  if ('faqSchemaJson' in body) data.faqSchemaJson = strOrNull(body.faqSchemaJson);
  if ('howToSchemaJson' in body) data.howToSchemaJson = strOrNull(body.howToSchemaJson);
  if ('relatedPostSlugs' in body) data.relatedPostSlugs = strOrNull(body.relatedPostSlugs);
  if ('pillarSlug' in body) data.pillarSlug = strOrNull(body.pillarSlug);
  if ('outboundLinksJson' in body) data.outboundLinksJson = strOrNull(body.outboundLinksJson);

  const ct = parseContentType(body.contentType);
  if (ct) data.contentType = ct;

  const st = parseNewsStatus(body.status);
  if (st) data.status = st;

  if ('commentsEnabled' in body) {
    data.commentsEnabled = Boolean(body.commentsEnabled);
  }
  if ('viewCount' in body) {
    const n = intOrNull(body.viewCount);
    if (n != null && n >= 0) data.viewCount = n;
  }
  if ('likeCount' in body) {
    const n = intOrNull(body.likeCount);
    if (n != null && n >= 0) data.likeCount = n;
  }
  if ('shareCount' in body) {
    const n = intOrNull(body.shareCount);
    if (n != null && n >= 0) data.shareCount = n;
  }
  if ('readingTimeMinutes' in body) {
    const n = intOrNull(body.readingTimeMinutes);
    if (n != null && n > 0) data.readingTimeMinutes = n;
  }

  return data;
}

export type TranslationPatch = {
  locale: string;
  title?: string;
  content?: string;
  excerpt?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  translatedSlug?: string | null;
  hreflangJson?: string | null;
};

export function parseTranslationPatches(body: Record<string, unknown>): TranslationPatch[] {
  const raw = body.translationPatches;
  if (!Array.isArray(raw)) return [];
  const out: TranslationPatch[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const o = row as Record<string, unknown>;
    const locale = typeof o.locale === 'string' ? o.locale.trim() : '';
    if (!locale) continue;
    const patch: TranslationPatch = { locale };
    if (typeof o.title === 'string') patch.title = o.title;
    if (typeof o.content === 'string') patch.content = o.content;
    if ('excerpt' in o) patch.excerpt = strOrNull(o.excerpt);
    if ('metaTitle' in o) patch.metaTitle = strOrNull(o.metaTitle);
    if ('metaDescription' in o) patch.metaDescription = strOrNull(o.metaDescription);
    if ('translatedSlug' in o) patch.translatedSlug = strOrNull(o.translatedSlug);
    if ('hreflangJson' in o) patch.hreflangJson = strOrNull(o.hreflangJson);
    out.push(patch);
  }
  return out;
}
