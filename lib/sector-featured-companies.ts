import { isCompanyDivisionSlug } from '@/lib/company-divisions';
import { mediaUrl } from '@/lib/media';
import type { GroupCompanyBrandId } from '@/lib/company-lead-variant';
import { orderedGroupBrandIdsForSector } from '@/lib/company-lead-variant';

/** Keys under the `Home` message namespace for logo `alt` text. */
export type SectorFeaturedBrandAltKey =
  | 'logoAltDlsin'
  | 'logoAltDealsmedi'
  | 'logoAltJanathaMirror';

/** Short display name under the `Home` namespace. */
export type SectorFeaturedBrandNameKey =
  | 'companyBrandDlsin'
  | 'companyBrandDealsmedi'
  | 'companyBrandJanathaMirror';

export type SectorFeaturedBrand = {
  href: string;
  imageSrc: string;
  altKey: SectorFeaturedBrandAltKey;
  nameKey: SectorFeaturedBrandNameKey;
};

const BRAND_BY_ID: Record<
  GroupCompanyBrandId,
  SectorFeaturedBrand
> = {
  dlsin: {
    href: '/companies/dlsin',
    imageSrc: mediaUrl('dlsin.webp'),
    altKey: 'logoAltDlsin',
    nameKey: 'companyBrandDlsin',
  },
  dealsmedi: {
    href: '/companies/dealsmedi',
    imageSrc: mediaUrl('dealsmedi.webp'),
    altKey: 'logoAltDealsmedi',
    nameKey: 'companyBrandDealsmedi',
  },
  'janatha-mirror': {
    href: '/companies/janatha-mirror',
    imageSrc: mediaUrl('janathamirror.webp'),
    altKey: 'logoAltJanathaMirror',
    nameKey: 'companyBrandJanathaMirror',
  },
};

export function getFeaturedBrandsForSector(sectorSlug: string): SectorFeaturedBrand[] {
  const key = sectorSlug.trim().toLowerCase();
  if (!isCompanyDivisionSlug(key)) return [];
  const order = orderedGroupBrandIdsForSector(key);
  return order.map((id) => BRAND_BY_ID[id]);
}

export function isFlagshipCompanySlug(slug: string): boolean {
  const s = slug.trim().toLowerCase();
  return s === 'dlsin' || s === 'dealsmedi' || s === 'janatha-mirror';
}
