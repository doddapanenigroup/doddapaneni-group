import { createTranslator } from '@/lib/translation-format';
import { getDictionary } from '@/lib/translations';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { getSectorBySlug } from '@/lib/sector-landing';
import { sectorHeroSubtitleForLocale, sectorPublicName } from '@/lib/sector-localized-copy';
import { listCompaniesBySectorSlug } from '@/lib/data/company-repository';
import { normalizeStoredImage } from '@/lib/sector-landing';
import SectorFeaturedBrandsGrid from '@/components/sector/SectorFeaturedBrandsGrid';

type Props = {
  locale: string;
  sectorSlug: string;
};

export default async function SectorCompaniesOnlyView({ locale, sectorSlug }: Props) {
  const normalized = sectorSlug.trim().toLowerCase();
  const sector = await getSectorBySlug(normalized);
  if (!sector) notFound();

  const companies = await listCompaniesBySectorSlug(sector.slug);
  const tHome = createTranslator(getDictionary(locale), 'Home');

  const sectorTitle = sectorPublicName(locale, sector.slug, sector.name);
  const heroDescription = sectorHeroSubtitleForLocale(
    locale,
    sector.slug,
    sector.description,
    sectorTitle,
  );
  const showDbCompanies = companies.length > 0;

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-blue-900 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="text-3xl font-bold text-white md:text-4xl lg:text-5xl">{sectorTitle}</h1>
          {heroDescription ? (
            <p className="mx-auto mt-4 max-w-3xl text-lg text-blue-200 md:text-xl">{heroDescription}</p>
          ) : null}
        </div>
      </section>

      <SectorFeaturedBrandsGrid locale={locale} sectorSlug={sector.slug} bordered />

      {showDbCompanies ? (
        <section aria-labelledby="sector-db-companies-heading" className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <h2
              id="sector-db-companies-heading"
              className="mb-2 font-serif text-2xl font-bold text-slate-900 sm:text-3xl"
            >
              {tHome('sectorCompaniesListHeading')}
            </h2>
            <p className="mb-8 text-sm text-slate-600 sm:text-base">{tHome('sectorCompaniesListLead')}</p>

            <ul className="space-y-4">
              {companies.map((c) => {
                const href = `/companies/${c.slug}`;
                const logoSrc = normalizeStoredImage(c.logoImage);
                return (
                  <li key={c.id}>
                    <Link
                      href={href}
                      locale={locale}
                      className="flex items-center gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                    >
                      <div className="relative h-14 w-32 shrink-0 sm:h-16 sm:w-36">
                        {logoSrc ? (
                          <Image
                            src={logoSrc}
                            alt={c.name}
                            fill
                            className="object-contain object-left"
                            sizes="144px"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-full w-full rounded-lg bg-slate-100" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-slate-900">{c.name}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                          {c.description?.trim() || tHome('sectorCompaniesListRowHint')}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}

