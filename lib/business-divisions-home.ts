import { createTranslator } from '@/lib/translation-format';
import { getDictionary } from '@/lib/translations';
import {
  COMPANY_DIVISION_SLUGS,
  type CompanyDivisionSlug,
} from '@/lib/company-divisions';
import { listPublicSectorsBySlugs, type PublicSector } from '@/lib/data/sector-repository';
import { unstable_cache } from 'next/cache';

/** Plain record — `unstable_cache` serializes results, so a `Map` would lose `.get` after restore. */
const cachedDivisionRows = unstable_cache(
  async (): Promise<Record<string, PublicSector>> => {
    const bySlug = await listPublicSectorsBySlugs(COMPANY_DIVISION_SLUGS);
    const out: Record<string, PublicSector> = {};
    for (const slug of COMPANY_DIVISION_SLUGS) {
      const row = bySlug.get(slug);
      if (row) out[slug] = row;
    }
    return out;
  },
  ['home-division-sector-rows'],
  { revalidate: 60, tags: ['sectors-public'] },
);

export type HomeDivision = {
  name: string;
  slug: string;
  description: string;
  active: boolean;
};

const FALLBACK_DESCRIPTION =
  'Programs, insights, and sector-specific capabilities across the Doddapaneni Group portfolio.';

export async function getBusinessDivisionsForHome(locale: string): Promise<HomeDivision[]> {
  const bySlug = await cachedDivisionRows();
  const tDivision = createTranslator(getDictionary(locale), 'DivisionLabels');
  const tAbout = createTranslator(getDictionary(locale), 'About');

  return COMPANY_DIVISION_SLUGS.map((slug) => {
    const row = bySlug[slug];
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
