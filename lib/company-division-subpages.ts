export const DIVISION_SUBPAGES = ['about', 'services', 'companies', 'contact'] as const;

export type DivisionSubpage = (typeof DIVISION_SUBPAGES)[number];

export function divisionContentPageKey(sectorSlug: string, sub: DivisionSubpage): string {
  return `${sectorSlug}-${sub}`;
}
