export const DIVISION_SUBPAGES = ['about', 'services', 'companies', 'contact'] as const;

export type DivisionSubpage = (typeof DIVISION_SUBPAGES)[number];

export function divisionContentPageKey(sectorSlug: string, sub: DivisionSubpage): string {
  return `${sectorSlug}-${sub}`;
}

/**
 * Public URL shape for division subpages.
 * Services use keyword-style slugs (`/digital-marketing-services`) for SEO.
 */
export function divisionSubpagePublicPath(sectorSlug: string, sub: DivisionSubpage): string {
  if (sub === 'services') return `/${sectorSlug}-services`;
  return `/${sectorSlug}/${sub}`;
}
