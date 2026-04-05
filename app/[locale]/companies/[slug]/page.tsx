import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { localeFromRouteParam } from '@/lib/locale-from-path';
import { routing } from '@/i18n/routing';
import { getCompanyBySlug } from '@/lib/data/company-repository';
import { normalizeStoredImage } from '@/lib/sector-landing';
import { parseAboutParagraphs } from '@/lib/company-about-paragraphs';
import CompanyPageForms from '@/components/companies/CompanyPageForms';
import CompanyPublicProfile from '@/components/companies/CompanyPublicProfile';
import { mediaUrl } from '@/lib/media';

export const dynamic = 'force-dynamic';

function defaultHeroImageForSector(sectorSlug: string): string {
  const s = sectorSlug.trim().toLowerCase();
  if (s === 'healthcare-medical') return mediaUrl('medical.webp');
  if (s === 'ecommerce-marketplace') return mediaUrl('ecommerce.webp');
  if (s === 'digital-marketing') return mediaUrl('digital-marketing.webp');
  if (s === 'construction-realestate') return mediaUrl('real-estate.webp');
  if (s === 'media-news-entertainment') return mediaUrl('news.webp');
  return mediaUrl('about.webp');
}

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: paramLocale, slug } = await params;
  const locale = localeFromRouteParam(paramLocale);
  const company = await getCompanyBySlug(slug);
  if (!company) return {};
  return {
    title: `${company.name} | Doddapaneni Group`,
    description: company.description?.trim() || `${company.name} company profile.`,
    alternates: {
      canonical:
        locale === routing.defaultLocale ? `/companies/${company.slug}` : `/${locale}/companies/${company.slug}`,
    },
  };
}

export default async function CompanyDynamicPage({ params }: Props) {
  const { locale: paramLocale, slug } = await params;
  const locale = localeFromRouteParam(paramLocale);
  if (!routing.locales.includes(locale)) notFound();

  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

  const logoSrc = normalizeStoredImage(company.logoImage);
  const heroSrc = normalizeStoredImage(company.heroImage) || defaultHeroImageForSector(company.sector.slug);
  const aboutParagraphs = parseAboutParagraphs(company.aboutContent);
  const socials = [
    { label: 'Facebook', href: company.facebookUrl },
    { label: 'Instagram', href: company.instagramUrl },
    { label: 'X', href: company.xUrl },
    { label: 'YouTube', href: company.youtubeUrl },
    { label: 'Pinterest', href: company.pinterestUrl },
  ].filter((s): s is { label: string; href: string } => !!s.href);

  return (
    <div className="min-h-screen bg-white">
      <CompanyPublicProfile
        locale={locale}
        companyName={company.name}
        companySlug={company.slug}
        logoSrc={logoSrc}
        description={company.description}
        websiteUrl={company.websiteUrl}
        sectorName={company.sector.name}
        sectorSlug={company.sector.slug}
        heroSrc={heroSrc}
        aboutParagraphs={aboutParagraphs}
        socials={socials}
      />
      <CompanyPageForms
        companySlug={company.slug}
        sectorSlug={company.sector.slug}
        companyDisplayName={company.name}
      />
    </div>
  );
}
