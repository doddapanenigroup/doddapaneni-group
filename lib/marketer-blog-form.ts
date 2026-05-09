import { DEFAULT_LOCALE } from '@/i18n/locales';
import { routing } from '@/i18n/routing';

export type BlogStatusForm = 'draft' | 'published' | 'scheduled' | 'archived';
export type BlogContentTypeForm = 'blog' | 'case_study' | 'news' | 'guide';

export type BlogTranslationRow = {
  locale: string;
  title: string;
  /** Omitted on list API responses to keep payloads small; present on single-post fetch. */
  content?: string;
  excerpt: string | null;
  translatedSlug: string | null;
  hreflangJson: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
};

export type BlogListRow = {
  id: string;
  title: string;
  slug: string;
  /** Omitted on list API responses to keep payloads small; present on single-post fetch / create. */
  content?: string;
  excerpt?: string | null;
  sectorId: string | null;
  sector?: { id: string; name: string; slug: string } | null;
  featuredImage?: string | null;
  featuredImageAlt?: string | null;
  bannerImage?: string | null;
  galleryImageUrls?: string | null;
  embeddedVideoUrl?: string | null;
  infographicUrls?: string | null;
  authorDisplayName?: string | null;
  authorBio?: string | null;
  status: BlogStatusForm;
  publishedAt?: string | null;
  scheduledPublishAt?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  keywords?: string | null;
  focusKeyword?: string | null;
  secondaryKeywords?: string | null;
  canonicalUrl?: string | null;
  breadcrumbTitle?: string | null;
  metaRobots?: string | null;
  categorySlugs?: string | null;
  tags?: string | null;
  subCategory?: string | null;
  contentType?: BlogContentTypeForm | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  viewCount?: number | null;
  likeCount?: number | null;
  shareCount?: number | null;
  commentsEnabled?: boolean | null;
  readingTimeMinutes?: number | null;
  articleSchemaJson?: string | null;
  faqSchemaJson?: string | null;
  howToSchemaJson?: string | null;
  relatedPostSlugs?: string | null;
  pillarSlug?: string | null;
  outboundLinksJson?: string | null;
  author?: { id: string; email: string; name: string | null };
  translations?: BlogTranslationRow[];
  /** Present on list API responses for dashboard sorting / display. */
  updatedAt?: string | null;
};

export type BlogFormState = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  sectorId: string;
  featuredImage: string;
  featuredImageAlt: string;
  bannerImage: string;
  galleryImageUrls: string;
  embeddedVideoUrl: string;
  infographicUrls: string;
  authorDisplayName: string;
  authorBio: string;
  status: BlogStatusForm;
  publishedAt: string;
  scheduledPublishAt: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  focusKeyword: string;
  secondaryKeywords: string;
  canonicalUrl: string;
  breadcrumbTitle: string;
  metaRobots: string;
  categorySlugs: string;
  tags: string;
  subCategory: string;
  contentType: BlogContentTypeForm;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  viewCount: string;
  likeCount: string;
  shareCount: string;
  commentsEnabled: boolean;
  readingTimeMinutes: string;
  articleSchemaJson: string;
  faqSchemaJson: string;
  howToSchemaJson: string;
  relatedPostSlugs: string;
  pillarSlug: string;
  outboundLinksJson: string;
  seoNote: string;
};

export function toDateTimeLocalValue(v: string | null | undefined) {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}

export function emptyBlogForm(partial?: Partial<BlogFormState>): BlogFormState {
  const base: BlogFormState = {
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    sectorId: '',
    featuredImage: '',
    featuredImageAlt: '',
    bannerImage: '',
    galleryImageUrls: '',
    embeddedVideoUrl: '',
    infographicUrls: '',
    authorDisplayName: '',
    authorBio: '',
    /** Default published so marketer-created posts show on public sector `/news/{sector}` pages immediately. */
    status: 'published',
    publishedAt: '',
    scheduledPublishAt: '',
    metaTitle: '',
    metaDescription: '',
    keywords: '',
    focusKeyword: '',
    secondaryKeywords: '',
    canonicalUrl: '',
    breadcrumbTitle: '',
    metaRobots: '',
    categorySlugs: '',
    tags: '',
    subCategory: '',
    contentType: 'blog',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    viewCount: '',
    likeCount: '',
    shareCount: '',
    commentsEnabled: true,
    readingTimeMinutes: '',
    articleSchemaJson: '',
    faqSchemaJson: '',
    howToSchemaJson: '',
    relatedPostSlugs: '',
    pillarSlug: '',
    outboundLinksJson: '',
    seoNote: '',
  };
  return { ...base, ...partial };
}

function str(v: unknown): string {
  if (v == null) return '';
  return typeof v === 'string' ? v : String(v);
}

function statusFromApi(v: unknown): BlogStatusForm {
  const s = str(v);
  if (s === 'published' || s === 'scheduled' || s === 'archived' || s === 'draft') return s;
  return 'draft';
}

function contentTypeFromApi(v: unknown): BlogContentTypeForm {
  const s = str(v);
  if (s === 'case_study' || s === 'news' || s === 'guide' || s === 'blog') return s;
  return 'blog';
}

/**
 * Build JSON body for marketer news create/update.
 * Optional SEO/media keys are omitted when empty so PATCH does not clear columns the user did not set in-session.
 */
export function marketerBlogFormApiPayload(form: BlogFormState): Record<string, unknown> {
  const out: Record<string, unknown> = { ...form };

  const optionalOnlyWhenSet: (keyof BlogFormState)[] = [
    'ogTitle',
    'ogDescription',
    'ogImage',
    'galleryImageUrls',
    'breadcrumbTitle',
    'canonicalUrl',
    'infographicUrls',
  ];

  for (const key of optionalOnlyWhenSet) {
    const v = form[key];
    delete out[key];
    if (typeof v === 'string' && v.trim() !== '') {
      out[key] = v.trim();
    }
  }

  return out;
}

export function blogFromApiToForm(b: BlogListRow | null | undefined, sectorDefault: string): BlogFormState {
  if (!b) return emptyBlogForm({ sectorId: sectorDefault });
  return emptyBlogForm({
    title: str(b.title),
    slug: str(b.slug),
    excerpt: str(b.excerpt),
    content: str(b.content),
    sectorId: str(b.sectorId) || sectorDefault,
    featuredImage: str(b.featuredImage),
    featuredImageAlt: str(b.featuredImageAlt),
    bannerImage: str(b.bannerImage),
    galleryImageUrls: str(b.galleryImageUrls),
    embeddedVideoUrl: str(b.embeddedVideoUrl),
    infographicUrls: str(b.infographicUrls),
    authorDisplayName: str(b.authorDisplayName) || str(b.author?.name) || str(b.author?.email),
    authorBio: str(b.authorBio),
    status: statusFromApi(b.status),
    publishedAt: b.publishedAt ? new Date(b.publishedAt).toISOString().slice(0, 10) : '',
    scheduledPublishAt: toDateTimeLocalValue(b.scheduledPublishAt ?? undefined),
    metaTitle: str(b.metaTitle),
    metaDescription: str(b.metaDescription),
    keywords: str(b.keywords),
    focusKeyword: str(b.focusKeyword),
    secondaryKeywords: str(b.secondaryKeywords),
    canonicalUrl: str(b.canonicalUrl),
    breadcrumbTitle: str(b.breadcrumbTitle),
    metaRobots: str(b.metaRobots),
    categorySlugs: str(b.categorySlugs),
    tags: str(b.tags),
    subCategory: str(b.subCategory),
    contentType: contentTypeFromApi(b.contentType),
    ogTitle: str(b.ogTitle),
    ogDescription: str(b.ogDescription),
    ogImage: str(b.ogImage),
    viewCount: b.viewCount != null ? String(b.viewCount) : '',
    likeCount: b.likeCount != null ? String(b.likeCount) : '',
    shareCount: b.shareCount != null ? String(b.shareCount) : '',
    commentsEnabled: b.commentsEnabled !== false,
    readingTimeMinutes: b.readingTimeMinutes != null ? String(b.readingTimeMinutes) : '',
    articleSchemaJson: str(b.articleSchemaJson),
    faqSchemaJson: str(b.faqSchemaJson),
    howToSchemaJson: str(b.howToSchemaJson),
    relatedPostSlugs: str(b.relatedPostSlugs),
    pillarSlug: str(b.pillarSlug),
    outboundLinksJson: str(b.outboundLinksJson),
    seoNote: '',
  });
}

export const BLOG_LOCALES_FOR_TRANSLATIONS = routing.locales.filter((l) => l !== DEFAULT_LOCALE);
