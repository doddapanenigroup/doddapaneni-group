import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ContentPageBoundary from '@/components/ContentPageBoundary';
import DivisionSubpageFallback from '@/components/divisions/DivisionSubpageFallback';
import SectorUnavailable from '@/components/sector/SectorUnavailable';
import { isCompanyDivisionSlug } from '@/lib/company-divisions';
import { divisionContentPageKey, type DivisionSubpage } from '@/lib/company-division-subpages';
import { localeFromRouteParam } from '@/lib/locale-from-path';
import { getSectorBySlug, sectorSubpageMetadata } from '@/lib/sector-landing';

type DynamicProps = { params: Promise<{ locale: string; company: string }> };

/** Metadata for `/[locale]/[company]/<about|services|contact>` (slug from dynamic segment). */
export function divisionSubMetadata(sub: DivisionSubpage) {
  return async function generateMetadata({ params }: DynamicProps): Promise<Metadata> {
    const { locale: paramLocale, company } = await params;
    const slug = company.trim().toLowerCase();
    return sectorSubpageMetadata(slug, sub, localeFromRouteParam(paramLocale));
  };
}

export function divisionSubPage(sub: DivisionSubpage) {
  return async function DivisionSubRoutePage({ params }: DynamicProps) {
    const { locale: paramLocale, company } = await params;
    const slug = company.trim().toLowerCase();
    const locale = localeFromRouteParam(paramLocale);
    const sector = await getSectorBySlug(slug);
    if (!sector) {
      if (isCompanyDivisionSlug(slug)) {
        return <SectorUnavailable locale={locale} slug={slug} />;
      }
      notFound();
    }
    const pageKey = divisionContentPageKey(slug, sub);
    return (
      <ContentPageBoundary pageKey={pageKey} locale={locale}>
        <DivisionSubpageFallback
          sectorSlug={slug}
          subpage={sub}
          sectorName={sector.name}
          locale={locale}
        />
      </ContentPageBoundary>
    );
  };
}
