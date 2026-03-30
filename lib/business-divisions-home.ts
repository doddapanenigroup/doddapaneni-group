import {
  COMPANY_DIVISION_SLUGS,
  type CompanyDivisionSlug,
} from '@/lib/company-divisions';
import { listPublicSectorsBySlugs } from '@/lib/data/sector-repository';
import { getTranslations } from 'next-intl/server';
import { unstable_noStore as noStore } from 'next/cache';

export type HomeDivision = {
  name: string;
  slug: string;
  description: string;
  active: boolean;
};

const FALLBACK_DESCRIPTION =
  'Programs, insights, and sector-specific capabilities across the Doddapaneni Group portfolio.';

export async function getBusinessDivisionsForHome(locale: string): Promise<HomeDivision[]> {
  noStore();
  const bySlug = await listPublicSectorsBySlugs(COMPANY_DIVISION_SLUGS);
  const tDivision = await getTranslations({ locale, namespace: 'DivisionLabels' });
  const tAbout = await getTranslations({ locale, namespace: 'About' });

  return COMPANY_DIVISION_SLUGS.map((slug) => {
    const row = bySlug.get(slug);
    const raw = row?.description?.trim();
    const hasDbDescription = !!(raw && raw.length > 0);
    return {
      slug,
      name: tDivision(slug as CompanyDivisionSlug),
      description:
        locale === 'en' && hasDbDescription
          ? raw!
          : tAbout(`divisionBlurbs.${slug}` as `divisionBlurbs.${CompanyDivisionSlug}`),
      /** Live toggle from DB; if row missing (edge case), default to false. */
      active: row != null ? row.isLive : false,
    };
  });
}
