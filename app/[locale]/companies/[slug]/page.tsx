import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { localeFromRouteParam } from '@/lib/locale-from-path';
import { routing } from '@/i18n/routing';
import { getCompanyBySlug } from '@/lib/data/company-repository';
import { normalizeStoredImage } from '@/lib/sector-landing';
import CompanyPageForms from '@/components/companies/CompanyPageForms';
import { mediaUrl } from '@/lib/media';
import { ExternalLink } from 'lucide-react';

function paragraphsFromText(raw: string | null | undefined): string[] {
  const s = raw?.trim();
  if (!s) return [];
  return s
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean);
}

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
    alternates: { canonical: locale === routing.defaultLocale ? `/companies/${company.slug}` : `/${locale}/companies/${company.slug}` },
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
  const aboutParagraphs = paragraphsFromText(company.aboutContent) || [];
  const socials = [
    { label: 'Facebook', href: company.facebookUrl },
    { label: 'Instagram', href: company.instagramUrl },
    { label: 'X', href: company.xUrl },
    { label: 'YouTube', href: company.youtubeUrl },
    { label: 'Pinterest', href: company.pinterestUrl },
  ].filter((s) => !!s.href);

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-blue-900 pt-24 pb-8 md:pt-24 md:pb-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl text-center">
          <div className="relative mx-auto h-12 w-[160px] overflow-hidden rounded">
            {logoSrc ? (
              <Image src={logoSrc} alt={`${company.name} logo`} fill className="object-contain" sizes="160px" />
            ) : (
              <div className="h-full w-full rounded bg-white/10" />
            )}
          </div>
          {company.description?.trim() ? (
            <p className="mt-2 text-blue-200 text-sm max-w-2xl mx-auto">{company.description.trim()}</p>
          ) : null}
          {company.websiteUrl?.trim() ? (
            <a
              href={company.websiteUrl.trim()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 mt-3 rounded-lg font-semibold text-blue-900 bg-white hover:bg-blue-100 transition-colors text-sm"
            >
              Visit website
              <ExternalLink size={16} strokeWidth={1.75} />
            </a>
          ) : null}
        </div>
      </section>

      <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-blue-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block w-12 h-0.5 rounded-full bg-blue-800 mb-4" />
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 tracking-tight">{company.name}</h1>
              <p className="text-sm text-slate-600 mb-5">
                Sector:{' '}
                <Link href={`/${company.sector.slug}`} locale={locale} className="font-semibold text-blue-900 hover:underline">
                  {company.sector.name}
                </Link>
              </p>
              {aboutParagraphs.length > 0 ? (
                <div className="space-y-4">
                  {aboutParagraphs.map((p, i) => (
                    <p key={`${company.slug}-about-${i}`} className="text-slate-700 text-base leading-relaxed">
                      {p}
                    </p>
                  ))}
                </div>
              ) : company.description?.trim() ? (
                <p className="text-slate-700 text-base leading-relaxed">{company.description.trim()}</p>
              ) : (
                <p className="text-slate-700 text-base leading-relaxed">
                  Learn more about {company.name} and get in touch with our team.
                </p>
              )}

              {socials.length > 0 ? (
                <div className="mt-6 flex flex-wrap gap-3">
                  {socials.map((s) => (
                    <a
                      key={s.label}
                      href={s.href!}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-50"
                    >
                      {s.label}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="relative aspect-[4/3] w-full min-h-[12.5rem] overflow-hidden rounded-xl border border-blue-200 bg-slate-100">
              <Image
                src={heroSrc}
                alt={`${company.name} hero`}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      <CompanyPageForms
        companySlug={company.slug}
        sectorSlug={company.sector.slug}
        companyDisplayName={company.name}
      />
    </div>
  );
}

