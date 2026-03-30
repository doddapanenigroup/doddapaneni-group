import type { CompanyDivisionSlug } from '@/lib/company-divisions';
import { isCompanyDivisionSlug } from '@/lib/company-divisions';

export type LeadFormVariant = 'general' | 'real_estate' | 'insurance' | 'health' | 'digital';

/**
 * Which flagship brand is listed for a division.
 * Some divisions should show only one flagship company.
 */
const SECTOR_PRIMARY_BRAND: Record<CompanyDivisionSlug, 'dlsin' | 'dealsmedi' | 'janatha-mirror'> = {
  'ecommerce-marketplace': 'dlsin',
  'healthcare-medical': 'dealsmedi',
  'digital-marketing': 'janatha-mirror',
  'software-it-ai': 'dlsin',
  'construction-realestate': 'dlsin',
  'media-news-entertainment': 'janatha-mirror',
  'staffing-consultancy': 'dealsmedi',
  'food-beverages': 'dlsin',
  'manufacturing-trading': 'dlsin',
  'logistics-warehousing': 'dlsin',
  'education-skill': 'dlsin',
  'import-export': 'dlsin',
};

const ALL_BRAND_IDS = ['dlsin', 'dealsmedi', 'janatha-mirror'] as const;
export type GroupCompanyBrandId = (typeof ALL_BRAND_IDS)[number];

export function primaryBrandIdForSector(sectorSlug: string): GroupCompanyBrandId {
  const key = sectorSlug.trim().toLowerCase();
  if (isCompanyDivisionSlug(key)) return SECTOR_PRIMARY_BRAND[key];
  return 'dlsin';
}

export function orderedGroupBrandIdsForSector(sectorSlug: string): GroupCompanyBrandId[] {
  const key = sectorSlug.trim().toLowerCase();

  // IT & AI sector is a content hub only — no flagship brand cards on this division page.
  if (key === 'software-it-ai') {
    return [];
  }

  const first = primaryBrandIdForSector(key);

  // Per request: these divisions show only their matching flagship brand.
  if (key === 'digital-marketing' || key === 'healthcare-medical' || key === 'ecommerce-marketplace') {
    return [first];
  }

  // Other divisions can show all three in a stable order.
  return [first, ...ALL_BRAND_IDS.filter((id) => id !== first)];
}

export function leadFormVariantFromSectorSlug(sectorSlug: string): LeadFormVariant {
  const s = sectorSlug.trim().toLowerCase();
  if (s === 'construction-realestate') return 'real_estate';
  if (s === 'healthcare-medical') return 'health';
  if (s === 'staffing-consultancy') return 'insurance';
  if (s === 'digital-marketing' || s === 'software-it-ai' || s === 'media-news-entertainment') {
    return 'digital';
  }
  return 'general';
}

const STATIC_COMPANY_SLUG_TO_SECTOR: Record<string, string> = {
  dlsin: 'ecommerce-marketplace',
  dealsmedi: 'healthcare-medical',
  'janatha-mirror': 'digital-marketing',
};

export function sectorSlugForStaticCompanyPage(companySlug: string): string | null {
  return STATIC_COMPANY_SLUG_TO_SECTOR[companySlug.trim().toLowerCase()] ?? null;
}

export function leadFormVariantForCompanySlug(companySlug: string, sectorSlug?: string | null): LeadFormVariant {
  if (sectorSlug?.trim()) return leadFormVariantFromSectorSlug(sectorSlug);
  const mapped = sectorSlugForStaticCompanyPage(companySlug);
  if (mapped) return leadFormVariantFromSectorSlug(mapped);
  return 'general';
}
