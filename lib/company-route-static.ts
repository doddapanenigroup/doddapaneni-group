import { COMPANY_DIVISION_SLUGS } from '@/lib/company-divisions';

/**
 * Build-time params for `app/[locale]/[company]/*`.
 * Matches the twelve division slugs (software-it-ai … import-export).
 * Non-listed `company` values still work when `dynamicParams` is true on that segment.
 */
export function generateCompanySegmentStaticParams(): { company: string }[] {
  return COMPANY_DIVISION_SLUGS.map((company) => ({ company }));
}
