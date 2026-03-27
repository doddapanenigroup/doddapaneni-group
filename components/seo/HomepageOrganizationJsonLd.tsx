import { COMPANY_DIVISION_SLUGS } from '@/lib/company-divisions';
import { listPublicSectorsBySlugs } from '@/lib/data/sector-repository';
import { buildHomepageOrganizationJsonLd } from '@/lib/seo/homepage-organization-jsonld';
import { getSiteOrigin } from '@/lib/site-origin';

type Props = {
  locale: string;
};

/** Emits Organization + subOrganization JSON-LD for the corporate homepage (server-rendered). */
export default async function HomepageOrganizationJsonLd({ locale }: Props) {
  const origin = getSiteOrigin();
  const sectorsBySlug = await listPublicSectorsBySlugs(COMPANY_DIVISION_SLUGS);
  const data = buildHomepageOrganizationJsonLd(origin, locale, sectorsBySlug);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
