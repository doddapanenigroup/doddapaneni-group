import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { localeFromRouteParam } from '@/lib/locale-from-path';
import { routing } from '@/i18n/routing';
import { getCompanyBySlug } from '@/lib/data/company-repository';
import { normalizeStoredImage } from '@/lib/sector-landing';

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
  const socials = [
    { label: 'Facebook', href: company.facebookUrl },
    { label: 'Instagram', href: company.instagramUrl },
    { label: 'X', href: company.xUrl },
    { label: 'YouTube', href: company.youtubeUrl },
    { label: 'Pinterest', href: company.pinterestUrl },
  ].filter((s) => !!s.href);

  return (
    <div className="min-h-screen bg-white px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-start sm:p-10">
          <div className="relative h-20 w-44 shrink-0">
            {logoSrc ? (
              <Image src={logoSrc} alt={company.name} fill className="object-contain object-left" sizes="176px" />
            ) : (
              <div className="h-full w-full rounded-xl bg-slate-100" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Company</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">{company.name}</h1>
            <p className="mt-1 text-sm text-slate-500">
              Sector:{' '}
              <Link href={`/${company.sector.slug}`} locale={locale} className="font-semibold text-blue-900 hover:underline">
                {company.sector.name}
              </Link>
            </p>
            {company.description ? <p className="mt-5 text-base leading-relaxed text-slate-700">{company.description}</p> : null}

            {socials.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-3">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href!}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-white"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

