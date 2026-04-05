export type LeadFormVariant = 'general' | 'real_estate' | 'insurance' | 'health' | 'digital';

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
