import type { CompanyDivisionSlug } from '@/lib/company-divisions';

/** `Blog` namespace keys in messages/*.json → used for `/[locale]/[division]/services` meta keywords. */
export const DIVISION_SERVICES_KEYWORDS_BLOG_KEYS = {
  'software-it-ai': 'divisionServicesKeywordsSoftwareItAi',
  'digital-marketing': 'divisionServicesKeywordsDigitalMarketing',
  'healthcare-medical': 'divisionServicesKeywordsHealthcareMedical',
  'construction-realestate': 'divisionServicesKeywordsConstructionRealestate',
  'ecommerce-marketplace': 'divisionServicesKeywordsEcommerceMarketplace',
  'media-news-entertainment': 'divisionServicesKeywordsMediaNewsEntertainment',
  'staffing-consultancy': 'divisionServicesKeywordsStaffingConsultancy',
  'food-beverages': 'divisionServicesKeywordsFoodBeverages',
  'manufacturing-trading': 'divisionServicesKeywordsManufacturingTrading',
  'logistics-warehousing': 'divisionServicesKeywordsLogisticsWarehousing',
  'education-skill': 'divisionServicesKeywordsEducationSkill',
  'import-export': 'divisionServicesKeywordsImportExport',
} as const satisfies Record<CompanyDivisionSlug, string>;
