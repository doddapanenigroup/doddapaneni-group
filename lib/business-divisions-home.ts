import {
  COMPANY_DIVISION_NAV_LABELS,
  COMPANY_DIVISION_SLUGS,
  type CompanyDivisionSlug,
  isActiveHomeDivisionSlug,
} from '@/lib/company-divisions';
import { listPublicSectorsBySlugs } from '@/lib/data/sector-repository';

export type HomeDivision = {
  name: string;
  slug: string;
  description: string;
  active: boolean;
};

const FALLBACK_DESCRIPTION =
  'Programs, insights, and sector-specific capabilities across the Doddapaneni Group portfolio.';

export async function getBusinessDivisionsForHome(): Promise<HomeDivision[]> {
  const bySlug = await listPublicSectorsBySlugs(COMPANY_DIVISION_SLUGS);

  return COMPANY_DIVISION_SLUGS.map((slug) => {
    const row = bySlug.get(slug);
    const raw = row?.description?.trim();
    return {
      slug,
      name:
        row?.name?.trim() ??
        COMPANY_DIVISION_NAV_LABELS[slug as CompanyDivisionSlug] ??
        slug.replace(/-/g, ' '),
      description: raw && raw.length > 0 ? raw : FALLBACK_DESCRIPTION,
      /** First four division slugs link to live public hubs; remaining eight show as launching soon. */
      active: isActiveHomeDivisionSlug(slug),
    };
  });
}
