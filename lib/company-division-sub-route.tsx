import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CompanyDivisionSubPageContent from '@/components/divisions/CompanyDivisionSubPageContent';
import SectorUnavailable from '@/components/sector/SectorUnavailable';
import { isCompanyDivisionSlug } from '@/lib/company-divisions';
import type { DivisionSubpage } from '@/lib/company-division-subpages';
import { getSectorBySlug, resolveAppLocale, sectorSubpageMetadata } from '@/lib/sector-landing';

type DynamicProps = { params: Promise<{ locale: string; company: string }> };

/** Metadata for `/[locale]/[company]/<about|services|contact>` (slug from dynamic segment). */
export function divisionSubMetadata(sub: DivisionSubpage) {
  return async function generateMetadata({ params }: DynamicProps): Promise<Metadata> {
    const { locale, company } = await params;
    const slug = company.trim().toLowerCase();
    return sectorSubpageMetadata(slug, sub, locale);
  };
}

export function divisionSubPage(sub: DivisionSubpage) {
  return async function DivisionSubRoutePage({ params }: DynamicProps) {
    const { locale: paramLocale, company } = await params;
    const slug = company.trim().toLowerCase();
    const locale = await resolveAppLocale(paramLocale);
    const sector = await getSectorBySlug(slug);
    if (!sector) {
      if (isCompanyDivisionSlug(slug)) {
        return <SectorUnavailable locale={locale} slug={slug} />;
      }
      notFound();
    }
    return (
      <CompanyDivisionSubPageContent
        sectorSlug={slug}
        subpage={sub}
        sectorName={sector.name}
        locale={locale}
      />
    );
  };
}
