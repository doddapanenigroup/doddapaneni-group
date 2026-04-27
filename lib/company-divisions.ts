import { routing } from '@/i18n/routing';

/**
 * Static company division routes under app/[locale]/<slug>/.
 * Each slug must exist in the Sector model (Sector.slug) for layouts and data to resolve.
 */
export const COMPANY_DIVISION_SLUGS = [
  'software-it-ai',
  'digital-marketing',
  'healthcare-medical',
  'construction-realestate',
  'ecommerce-marketplace',
  'media-news-entertainment',
  'staffing-consultancy',
  'food-beverages',
  'manufacturing-trading',
  'logistics-warehousing',
  'education-skill',
  'import-export',
] as const;

export type CompanyDivisionSlug = (typeof COMPANY_DIVISION_SLUGS)[number];

/** Divisions with full public hubs on the homepage (remaining show “Coming soon”). */
export const HOME_DIVISION_ACTIVE_SLUGS = [
  'software-it-ai',
  'digital-marketing',
  'healthcare-medical',
  'construction-realestate',
] as const satisfies readonly CompanyDivisionSlug[];

export function isActiveHomeDivisionSlug(slug: string): boolean {
  return (HOME_DIVISION_ACTIVE_SLUGS as readonly string[]).includes(slug);
}

/**
 * These divisions use `/{slug}-services` for the public **landing** URL (keyword-style path), e.g.
 * `/software-it-ai-services`. Sub-routes like `/software-it-ai/about` still use the base sector slug.
 */
export const DIVISION_KEYWORD_SERVICES_LANDING_SLUGS = [
  'software-it-ai',
  'digital-marketing',
  'healthcare-medical',
] as const satisfies readonly CompanyDivisionSlug[];

export function isDivisionKeywordServicesLandingSlug(
  slug: string,
): slug is (typeof DIVISION_KEYWORD_SERVICES_LANDING_SLUGS)[number] {
  return (DIVISION_KEYWORD_SERVICES_LANDING_SLUGS as readonly string[]).includes(slug);
}

/** Public path segment for the division home/landing (e.g. `software-it-ai-services`). */
export function divisionLandingPathSegment(slug: string): string {
  const s = slug.trim().toLowerCase();
  if (isDivisionKeywordServicesLandingSlug(s)) {
    return `${s}-services`;
  }
  return s;
}

/** URL path for the public division landing, e.g. `/software-it-ai-services` or `/construction-realestate`. */
export function divisionLandingPublicPath(slug: string): string {
  return `/${divisionLandingPathSegment(slug)}`;
}

const KEYWORD_LANDING_SUFFIX = '-services';

/**
 * Resolves a URL first segment (maybe `software-it-ai-services`) to a canonical `CompanyDivisionSlug`
 * when it is a division or `base-services` for keyword landings.
 */
export function pathSegmentToCompanyDivisionSlug(
  seg: string | undefined,
): CompanyDivisionSlug | null {
  if (!seg) return null;
  const raw = seg.trim().toLowerCase();
  if (!raw) return null;
  if (isCompanyDivisionSlug(raw)) return raw;
  if (raw.endsWith(KEYWORD_LANDING_SUFFIX)) {
    const base = raw.slice(0, -KEYWORD_LANDING_SUFFIX.length);
    if (isCompanyDivisionSlug(base) && isDivisionKeywordServicesLandingSlug(base)) {
      return base;
    }
  }
  return null;
}

/**
 * `[company]` dynamic segment from the URL → sector row `slug` (DB + `getPublicSectorBySlug`).
 * Maps keyword landings like `software-it-ai-services` → `software-it-ai`; leaves other slugs as-is.
 */
export function resolveCompanyRouteParamToSectorSlug(companySegment: string): string {
  const mapped = pathSegmentToCompanyDivisionSlug(companySegment);
  if (mapped) return mapped;
  return companySegment.trim().toLowerCase();
}

export function isCompanyDivisionSlug(s: string): s is CompanyDivisionSlug {
  return (COMPANY_DIVISION_SLUGS as readonly string[]).includes(s);
}

const CANONICAL_SLUG_SET = new Set(COMPANY_DIVISION_SLUGS as readonly string[]);

/**
 * Admin / dashboards: only the 12 group-division sectors belong in UI. Drops legacy/extra `Sector` rows.
 * Order matches `COMPANY_DIVISION_SLUGS`; first row wins if the API returns duplicate slugs.
 */
export function pickCanonicalSectorRows<T extends { slug: string }>(rows: readonly T[]): T[] {
  const bySlug = new Map<string, T>();
  for (const row of rows) {
    const key = row.slug.trim().toLowerCase();
    if (!CANONICAL_SLUG_SET.has(key)) continue;
    if (!bySlug.has(key)) bySlug.set(key, row);
  }
  return COMPANY_DIVISION_SLUGS.map((slug) => bySlug.get(slug)).filter((x): x is T => x != null);
}

/**
 * Public UI label for a sector row: use the canonical twelve-division name when `slug` matches,
 * otherwise the database name (e.g. custom sectors) or `fallback`.
 */
export function canonicalDivisionDisplayName(
  slug: string | null | undefined,
  dbName: string | null | undefined,
  fallback = 'News',
): string {
  const key = slug?.trim().toLowerCase();
  if (key && isCompanyDivisionSlug(key)) {
    return COMPANY_DIVISION_NAV_LABELS[key];
  }
  const trimmed = dbName?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

/** Sector hubs that show marketing focus areas only (no news listing), matching the digital-marketing content pattern. */
export const SECTOR_LANDING_CONTENT_ONLY_SLUGS = [
  'software-it-ai',
  'healthcare-medical',
  'media-news-entertainment',
] as const satisfies readonly CompanyDivisionSlug[];

export function isSectorLandingContentOnlySlug(slug: string): boolean {
  return (SECTOR_LANDING_CONTENT_ONLY_SLUGS as readonly string[]).includes(slug);
}
/**
 * Display names for header/footer (aligned with `scripts/sector-seeds.mjs` Sector.name).
 */
/**
 * Section order on `/news` (hub): matches common “blogs by category” layouts
 * (e.g. Digital Marketing first, then IT & AI, healthcare, construction, then the rest).
 */
const BLOG_HUB_SECTION_PRIORITY = [
  'digital-marketing',
  'software-it-ai',
  'healthcare-medical',
  'construction-realestate',
] as const satisfies readonly CompanyDivisionSlug[];

export function orderedCompanyDivisionSlugsForBlogHub(): CompanyDivisionSlug[] {
  const prioritySet = new Set<string>(BLOG_HUB_SECTION_PRIORITY);
  const rest = COMPANY_DIVISION_SLUGS.filter((s) => !prioritySet.has(s));
  return [...BLOG_HUB_SECTION_PRIORITY, ...rest];
}

export const COMPANY_DIVISION_NAV_LABELS: Record<CompanyDivisionSlug, string> = {
  'software-it-ai': 'Information Technology & AI Development',
  'digital-marketing': 'Digital Marketing',
  'healthcare-medical': 'Healthcare & Medical',
  'construction-realestate': 'Construction & Real Estate',
  'ecommerce-marketplace': 'E-commerce Marketplace',
  'media-news-entertainment': 'Media, News & Entertainment',
  'staffing-consultancy': 'Human Resources & Consultancy',
  'food-beverages': 'Food & Baverages',
  'manufacturing-trading': 'Manufacturing & Trading',
  'logistics-warehousing': 'Logistics & Warehousing',
  'education-skill': 'Education & Skill Development',
  'import-export': 'Import & Export',
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

/** First path segment when it is a company division (e.g. /software-it-ai/services or /software-it-ai-services). */
export function activeCompanyDivisionSlugFromPathname(pathname: string): CompanyDivisionSlug | null {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return null;
  let i = 0;
  if (routing.locales.includes(parts[0] as (typeof routing.locales)[number])) {
    i = 1;
  }
  return pathSegmentToCompanyDivisionSlug(parts[i]);
}
