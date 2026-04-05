import { isCompanyDivisionSlug } from '@/lib/company-divisions';

export type SectorFeaturedBrandAltKey = string;
export type SectorFeaturedBrandNameKey = string;

export type SectorFeaturedBrand = {
  href: string;
  imageSrc: string;
  altKey: SectorFeaturedBrandAltKey;
  nameKey: SectorFeaturedBrandNameKey;
};

/** Featured brand tiles on sector pages (legacy flagship grid). Intentionally empty. */
export function getFeaturedBrandsForSector(sectorSlug: string): SectorFeaturedBrand[] {
  const key = sectorSlug.trim().toLowerCase();
  if (!isCompanyDivisionSlug(key)) return [];
  return [];
}
