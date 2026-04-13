import { createTranslator } from '@/lib/translation-format';
import { getDictionary } from '@/lib/translations';
import {
  isCompanyDivisionSlug,
  type CompanyDivisionSlug,
} from '@/lib/company-divisions';

/**
 * Public sector title: localized label for canonical division slugs; otherwise DB name.
 */
export function sectorPublicName(locale: string, sectorSlug: string, dbName: string): string {
  const slug = sectorSlug.trim().toLowerCase();
  if (isCompanyDivisionSlug(slug)) {
    const t = createTranslator(getDictionary(locale), 'DivisionLabels');
    return t(slug as CompanyDivisionSlug);
  }
  return dbName;
}

/**
 * Hero subtitle under the main title.
 * - Canonical divisions: `About.divisionBlurbs.{slug}` for non-English; English prefers DB copy when set.
 * - Other sectors: English prefers DB copy, then `Blog.sectorHeroDescriptionFallback`; non-English never uses
 *   DB English — uses `Blog.sectorHeroDescriptionFallback` when `displayNameForFallback` is set.
 */
export function sectorHeroSubtitleForLocale(
  locale: string,
  sectorSlug: string,
  dbDescription: string | null | undefined,
  displayNameForFallback?: string,
): string {
  const slug = sectorSlug.trim().toLowerCase();
  const tAbout = createTranslator(getDictionary(locale), 'About');
  const tBlog = createTranslator(getDictionary(locale), 'Blog');

  if (isCompanyDivisionSlug(slug)) {
    const key = `divisionBlurbs.${slug}`;
    if (locale === 'en') {
      const fromDb = dbDescription?.trim();
      if (fromDb) return fromDb;
    }
    return tAbout(key);
  }

  const fromDb = dbDescription?.trim();
  if (locale === 'en') {
    if (fromDb) return fromDb;
    if (displayNameForFallback) {
      return tBlog('sectorHeroDescriptionFallback', { name: displayNameForFallback });
    }
    return '';
  }

  if (displayNameForFallback) {
    return tBlog('sectorHeroDescriptionFallback', { name: displayNameForFallback });
  }
  return '';
}
