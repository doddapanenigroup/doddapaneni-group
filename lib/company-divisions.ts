import { routing } from '@/i18n/routing';

/**
 * Static company division routes under app/[locale]/<slug>/.
 * Each slug must exist in the Sector model (Sector.slug) for layouts and data to resolve.
 */
export const COMPANY_DIVISION_SLUGS = [
  'Information Technology & AI Development',
  'Digital Marketing',
  'Healthcare & Medical',
  'Construction & Real Estate',
  'E-commerce & Marketplace',
  'Media, News & Entertainment',
  'Staffing & Consultancy',
  'Food & Beverages',
  'Manufacturing & Trading',
  'Logistics & Warehousing',
  'Education & Skill Development',
  'Import & Export',
] as const;

export type CompanyDivisionSlug = (typeof COMPANY_DIVISION_SLUGS)[number];

/** Divisions with full public hubs on the homepage (remaining show “Coming soon”). */
export const HOME_DIVISION_ACTIVE_SLUGS = [
  'Information Technology & AI Development',
  'Digital Marketing',
  'Healthcare & Medical',
  'Construction & Real Estate',
] as const satisfies readonly CompanyDivisionSlug[];

export function isActiveHomeDivisionSlug(slug: string): boolean {
  return (HOME_DIVISION_ACTIVE_SLUGS as readonly string[]).includes(slug);
}

export function isCompanyDivisionSlug(s: string): s is CompanyDivisionSlug {
  return (COMPANY_DIVISION_SLUGS as readonly string[]).includes(s);
}

/** Sector hubs that show marketing focus areas only (no news listing), matching the digital-marketing content pattern. */
export const SECTOR_LANDING_CONTENT_ONLY_SLUGS = [
  'Information Technology & AI Development',
  'Healthcare & Medical',
  'Media, News & Entertainment',
] as const satisfies readonly CompanyDivisionSlug[]
/**
 * Display names for header/footer (aligned with `scripts/sector-seeds.mjs` Sector.name).
 */
export const COMPANY_DIVISION_NAV_LABELS: Record<CompanyDivisionSlug, string> = {
  'Information Technology & AI Development': 'Information Technology & AI Development ',
  'Digital Marketing': 'Digital Marketing',
  'Healthcare & Medical': 'Healthcare & Medical',
  'Construction & Real Estate': 'Construction & Real Estate',
  'E-commerce & Marketplace': 'E-commerce & Marketplace',
  'Media, News & Entertainment': 'Media, News & Entertainment',
  'Staffing & Consultancy': 'Staffing & Consultancy',
  'Food & Beverages': 'Food & Beverages',
  'Manufacturing & Trading': 'Manufacturing & Trading',
  'Logistics & Warehousing': 'Logistics & Warehousing',
  'Education & Skill Development': 'Education & Skill Development',
  'Import & Export': 'Import & Export',
};

export type CompanyDivisionNavItem = {
  slug: CompanyDivisionSlug;
  label: string;
  active: boolean;
};

export function getCompanyDivisionNavItems(): CompanyDivisionNavItem[] {
  return COMPANY_DIVISION_SLUGS.map((slug) => ({
    slug,
    label: COMPANY_DIVISION_NAV_LABELS[slug],
    active: isActiveHomeDivisionSlug(slug),
  }));
}

/** First path segment when it is a company division (e.g. /software-it-ai/services). */
export function activeCompanyDivisionSlugFromPathname(pathname: string): CompanyDivisionSlug | null {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return null;
  let i = 0;
  if (routing.locales.includes(parts[0] as (typeof routing.locales)[number])) {
    i = 1;
  }
  const seg = parts[i];
  if (!seg || !isCompanyDivisionSlug(seg)) return null;
  return seg;
}
