import { COMPANY_DIVISION_SLUGS } from '@/lib/company-divisions';
import { DIVISION_SUBPAGES, divisionContentPageKey } from '@/lib/company-division-subpages';

/** Maps CMS `pageKey` (default locale) to public pathname for sitemap `lastmod`. */
const STATIC_PAGE_KEY_TO_PATH: Record<string, string> = {
  home: '/',
  about: '/about',
  services: '/services',
  contact: '/contact',
  faq: '/faq',
  'privacy-policy': '/privacy-policy',
  terms: '/terms',
  disclaimer: '/disclaimer',
  'companies-dealsmedi': '/companies/dealsmedi',
  'companies-dlsin': '/companies/dlsin',
  'companies-janatha-mirror': '/companies/janatha-mirror',
};

/** Returns a root-relative path or `null` if the key does not correspond to a public URL. */
export function sitemapPathFromPageKey(pageKey: string): string | null {
  const fromStatic = STATIC_PAGE_KEY_TO_PATH[pageKey];
  if (fromStatic) return fromStatic;

  for (const slug of COMPANY_DIVISION_SLUGS) {
    for (const sub of DIVISION_SUBPAGES) {
      if (pageKey === divisionContentPageKey(slug, sub)) {
        return `/${slug}/${sub}`;
      }
    }
  }
  return null;
}
