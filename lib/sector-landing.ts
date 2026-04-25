import { createTranslator } from '@/lib/translation-format';
import { getDictionary } from '@/lib/translations';
import type { Metadata } from 'next';
import { mediaUrl } from '@/lib/media';
import { routing } from '@/i18n/routing';
import { publishScheduledContent } from '@/lib/publish-scheduled';
import { alternateLanguagesForPathname } from '@/lib/sitemap-build';
import { getSiteOrigin } from '@/lib/site-origin';
import type { DivisionSubpage } from '@/lib/company-division-subpages';
import { divisionSubpagePublicPath } from '@/lib/company-division-subpages';
import {
  getPublicSectorBySlug,
  type PublicSector,
} from '@/lib/data/sector-repository';
import { listPublishedBlogsForSectorPage } from '@/lib/data/sector-blog-repository';
import { publicPathWithLocale } from '@/lib/public-path-with-locale';
import { isCompanyDivisionSlug } from '@/lib/company-divisions';
import { DIVISION_SERVICES_KEYWORDS_BLOG_KEYS } from '@/lib/division-services-meta-keywords';

export { publicPathWithLocale };

export const SECTOR_LANDING_PAGE_SIZE = 12;

const SITE_NAME = 'Doddapaneni Group';

/** Normalizes sector display name for titles (commas / ampersand → spaces). */
export function formatDivisionNameForSeo(sectorName: string): string {
  return sectorName
    .replace(/,/g, ' ')
    .replace(/\s*&\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** e.g. "Software IT & AI Services | Doddapaneni Group" */
export function buildCompanyDivisionTitle(sectorName: string): string {
  return `${formatDivisionNameForSeo(sectorName)} Services | ${SITE_NAME}`;
}

export function buildCompanyDivisionDescription(row: SectorLandingRow): string {
  const trimmed = row.description?.trim();
  if (trimmed) {
    return trimmed.length > 320 ? `${trimmed.slice(0, 317)}…` : trimmed;
  }
  return `Explore ${formatDivisionNameForSeo(row.name)} services, sector insights, and published articles from ${SITE_NAME}.`;
}

/** Open Graph locale — avoid invented region codes for regional languages. */
function openGraphLocale(locale: string): string {
  if (locale === 'en') return 'en_US';
  if (locale === 'es') return 'es_ES';
  return locale;
}

export type SectorLandingRow = PublicSector;

/** Card excerpt without loading full HTML `content` (faster list queries). */
export function excerptForSectorBlogCard(post: {
  title: string;
  metaDescription: string | null;
  ogDescription: string | null;
}): string {
  const raw = (post.metaDescription?.trim() || post.ogDescription?.trim()) ?? '';
  if (raw) {
    return raw.length > 180 ? `${raw.slice(0, 180)}…` : raw;
  }
  return `Read the latest insights: ${post.title}.`;
}

export function estimateReadMinutesForCard(post: {
  title: string;
  metaDescription: string | null;
  ogDescription: string | null;
}): number {
  const text = `${post.title} ${post.metaDescription ?? ''} ${post.ogDescription ?? ''}`;
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export function normalizeStoredImage(value: string | null): string | null {
  if (!value) return null;
  const s = value.trim();
  if (!s) return null;
  if (s.startsWith('/api/media/')) return s;
  if (s.startsWith('api/media/')) return `/${s}`;
  if (s.startsWith('http://') || s.startsWith('https://')) {
    try {
      const u = new URL(s);
      if (u.pathname.startsWith('/api/media/')) return u.pathname;
    } catch {
      // ignore
    }
    return s;
  }
  return mediaUrl(s.startsWith('/') ? s.slice(1) : s);
}

export function toPositiveSectorPage(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? '1', 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
}

/** Same cached lookup as `getPublicSectorBySlug` (`@/lib/data`). */
export const getSectorBySlug = getPublicSectorBySlug;

export type SectorLandingBlogRow = {
  slug: string;
  title: string;
  featuredImage: string | null;
  publishedAt: Date | null;
  metaDescription: string | null;
  ogDescription: string | null;
};

export type SectorLandingFetch = {
  sector: SectorLandingRow;
  rows: SectorLandingBlogRow[];
  total: number;
  totalPages: number;
  page: number;
};

export async function fetchSectorLandingData(
  sectorSlug: string,
  page: number,
  locale: string = routing.defaultLocale,
): Promise<SectorLandingFetch | null> {
  const sector = await getPublicSectorBySlug(sectorSlug);
  if (!sector) return null;

  const now = new Date();
  await publishScheduledContent(now);

  const { rows, total } = await listPublishedBlogsForSectorPage({
    sector,
    page,
    pageSize: SECTOR_LANDING_PAGE_SIZE,
    now,
    locale,
  });

  const totalPages = Math.max(1, Math.ceil(total / SECTOR_LANDING_PAGE_SIZE));
  return { sector, total, rows, totalPages, page };
}

export async function sectorLandingMetadata(
  sectorSlug: string,
  paramLocale: string,
): Promise<Metadata> {
  const locale = routing.locales.includes(paramLocale as (typeof routing.locales)[number])
    ? paramLocale
    : routing.defaultLocale;
  const row = await getPublicSectorBySlug(sectorSlug);
  if (!row) return {};
  const title = buildCompanyDivisionTitle(row.name);
  const description = buildCompanyDivisionDescription(row);
  const origin = getSiteOrigin();
  const pathRel = publicPathWithLocale(locale, row.slug);
  const canonical = `${origin}${pathRel}`;
  const pathnameForHreflang = `/${row.slug}`;

  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: {
      canonical,
      languages: alternateLanguagesForPathname(origin, pathnameForHreflang),
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: 'website',
      locale: openGraphLocale(locale),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

function keywordsForDivisionServicesPage(locale: string, sectorSlug: string): string[] | undefined {
  if (!isCompanyDivisionSlug(sectorSlug)) return undefined;
  const i18nKey = DIVISION_SERVICES_KEYWORDS_BLOG_KEYS[sectorSlug];
  const blog = getDictionary(locale).Blog as Record<string, unknown>;
  const raw = blog[i18nKey];
  if (typeof raw !== 'string' || !raw.trim()) return undefined;
  const list = raw.split(',').map((k) => k.trim()).filter(Boolean);
  return list.length > 0 ? list : undefined;
}

function buildDivisionSubpageDescription(
  row: SectorLandingRow,
  subLabel: string,
  servicesWord: string,
): string {
  const base = row.description?.trim();
  if (base) {
    const combined = `${subLabel} — ${base}`;
    return combined.length > 320 ? `${combined.slice(0, 317)}…` : combined;
  }
  return `${subLabel} — ${formatDivisionNameForSeo(row.name)} ${servicesWord} | ${SITE_NAME}.`;
}

export async function sectorSubpageMetadata(
  sectorSlug: string,
  sub: DivisionSubpage,
  paramLocale: string,
): Promise<Metadata> {
  const locale = routing.locales.includes(paramLocale as (typeof routing.locales)[number])
    ? paramLocale
    : routing.defaultLocale;
  const row = await getPublicSectorBySlug(sectorSlug);
  if (!row) return {};
  const tBlog = createTranslator(getDictionary(locale), 'Blog');
  const subLabel =
    sub === 'about'
      ? tBlog('divisionSubpageAbout')
      : sub === 'services'
        ? tBlog('divisionSubpageServices')
        : sub === 'companies'
          ? tBlog('divisionSubpageCompanies')
          : tBlog('divisionSubpageContact');
  const servicesWord = tBlog('divisionSubpageServices');
  const origin = getSiteOrigin();
  const pathRel = publicPathWithLocale(locale, divisionSubpagePublicPath(row.slug, sub));
  const canonical = `${origin}${pathRel}`;
  const pathnameForHreflang = divisionSubpagePublicPath(row.slug, sub);
  const title = `${subLabel} | ${formatDivisionNameForSeo(row.name)} ${servicesWord} | ${SITE_NAME}`;
  const description = buildDivisionSubpageDescription(row, subLabel, servicesWord);
  const keywords =
    sub === 'services' ? keywordsForDivisionServicesPage(locale, sectorSlug) : undefined;

  return {
    title,
    description,
    ...(keywords?.length ? { keywords } : {}),
    robots: { index: true, follow: true },
    alternates: {
      canonical,
      languages: alternateLanguagesForPathname(origin, pathnameForHreflang),
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: 'website',
      locale: openGraphLocale(locale),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}
