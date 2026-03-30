import type { CompanyDivisionSlug } from '@/lib/company-divisions';
import { isCompanyDivisionSlug } from '@/lib/company-divisions';
import { mediaUrl } from '@/lib/media';

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

const BRANDS_BY_SECTOR: Partial<
  Record<CompanyDivisionSlug, readonly SectorFeaturedBrand[]>
> = {
  'software-it-ai': [
    {
      href: '/companies/dlsin',
      imageSrc: mediaUrl('dlsin.webp'),
      altKey: 'logoAltDlsin',
      nameKey: 'companyBrandDlsin',
    },
  ],
  'healthcare-medical': [
    {
      href: '/companies/dealsmedi',
      imageSrc: mediaUrl('dealsmedi.webp'),
      altKey: 'logoAltDealsmedi',
      nameKey: 'companyBrandDealsmedi',
    },
  ],
  'ecommerce-marketplace': [
    {
      href: '/companies/dlsin',
      imageSrc: mediaUrl('dlsin.webp'),
      altKey: 'logoAltDlsin',
      nameKey: 'companyBrandDlsin',
    },
  ],
  'digital-marketing': [
    {
      href: '/companies/janatha-mirror',
      imageSrc: mediaUrl('janathamirror.webp'),
      altKey: 'logoAltJanathaMirror',
      nameKey: 'companyBrandJanathaMirror',
    },
  ],
  'construction-realestate': [],
};

export function getFeaturedBrandsForSector(sectorSlug: string): SectorFeaturedBrand[] {
  const key = sectorSlug.trim().toLowerCase();
  if (!isCompanyDivisionSlug(key)) return [];
  const list = BRANDS_BY_SECTOR[key];
  return list ? [...list] : [];
}
