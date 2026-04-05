import {
  COMPANY_DIVISION_NAV_LABELS,
  COMPANY_DIVISION_SLUGS,
  type CompanyDivisionSlug,
} from '@/lib/company-divisions';
import { absoluteUrlForLocale } from '@/lib/sitemap-build';

const ORG_NAME = 'Doddapaneni Group';

/** Social profiles confirmed on the public site (extend when new channels go live). */
const SAME_AS = [
  'https://www.facebook.com/profile.php?id=61588007971937',
  'https://x.com/DoddapanenGroup',
  'https://www.instagram.com/doddapanrnigroup/',
  'https://www.pinterest.com/doddapanenigroup/',
];

/**
 * Homepage Organization JSON-LD with twelve division `subOrganization` entries
 * for rich results and entity consolidation. Names prefer Prisma `Sector` when present.
 */
export function buildHomepageOrganizationJsonLd(
  origin: string,
  locale: string,
  sectorsBySlug?: Map<string, { name: string; slug: string }>,
): Record<string, unknown> {
  const siteUrl = absoluteUrlForLocale(origin, locale, '/');
  const logoUrl = `${origin.replace(/\/$/, '')}/doddapaneni-logo.png`;

  const subOrganization = (COMPANY_DIVISION_SLUGS as readonly CompanyDivisionSlug[]).map((slug) => {
    const row = sectorsBySlug?.get(slug);
    const name = row?.name?.trim() || COMPANY_DIVISION_NAV_LABELS[slug];
    return {
      '@type': 'Organization',
      name,
      url: absoluteUrlForLocale(origin, locale, `/${slug}`),
    };
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteUrl.replace(/\/$/, '') || origin}#organization`,
    name: ORG_NAME,
    url: siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: logoUrl,
      contentUrl: logoUrl,
    },
    sameAs: SAME_AS,
    subOrganization,
  };
}
