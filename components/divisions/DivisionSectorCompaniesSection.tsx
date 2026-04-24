import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { Building2, ArrowRight } from 'lucide-react';
import { listCompaniesBySectorSlug } from '@/lib/data/company-repository';
import { normalizeStoredImage } from '@/lib/sector-landing';
import { createTranslator } from '@/lib/translation-format';
import { getDictionary } from '@/lib/translations';

type Props = {
  sectorSlug: string;
  sectorName: string;
  locale: string;
  embeddedInDivisionShell: boolean;
  /** False when CMS intro is shown above this block. */
  showIntro: boolean;
};

export default async function DivisionSectorCompaniesSection({
  sectorSlug,
  sectorName,
  locale,
  embeddedInDivisionShell,
  showIntro,
}: Props) {
  const companies = await listCompaniesBySectorSlug(sectorSlug);
  const t = createTranslator(getDictionary(locale), 'Blog');

  const heroVertical =
    embeddedInDivisionShell === true
      ? 'pt-8 pb-8 sm:pt-10 sm:pb-10'
      : 'pt-24 pb-10 sm:pt-28 sm:pb-12';

  const desc = (raw: string | null | undefined) => {
    const s = raw?.trim();
    if (!s) return '';
    return s.length > 220 ? `${s.slice(0, 217)}…` : s;
  };

  return (
    <div className="bg-white">
      {showIntro ? (
        <section
          className={`border-b border-slate-200 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 px-4 sm:px-6 lg:px-8 ${heroVertical}`}
        >
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200/90">
              {t('divisionCompaniesEyebrow')}
            </p>
            <h1 className="mt-3 font-serif text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
              {t('divisionCompaniesHeading', { sectorName })}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-200 sm:text-base">
              {t('divisionCompaniesLead')}
            </p>
          </div>
        </section>
      ) : null}

      <section className="border-b border-slate-100 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {companies.length === 0 ? (
            <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-14 text-center">
              <Building2 className="mx-auto h-10 w-10 text-slate-400" aria-hidden />
              <p className="mt-4 text-base font-semibold text-slate-800">{t('divisionCompaniesEmptyTitle')}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{t('divisionCompaniesEmptyBody')}</p>
            </div>
          ) : (
            <>
              <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="font-serif text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    {t('divisionCompaniesGridTitle')}
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm text-slate-600 sm:text-base">{t('divisionCompaniesGridSubtitle')}</p>
                </div>
                <p className="text-sm font-medium text-slate-500">
                  {t('divisionCompaniesCount', { count: companies.length })}
                </p>
              </div>
              <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {companies.map((c) => {
                  const logoSrc = normalizeStoredImage(c.logoImage);
                  const excerpt = desc(c.description);
                  return (
                    <li key={c.id}>
                      <Link
                        href={`/companies/${c.slug}`}
                        locale={locale}
                        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
                      >
                        <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50/80 px-5 py-4">
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
                            {logoSrc ? (
                              <Image src={logoSrc} alt={c.name} fill className="object-contain p-1.5" sizes="56px" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400">
                                <Building2 className="h-6 w-6" aria-hidden />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-base font-bold text-slate-900 group-hover:text-blue-800">
                              {c.name}
                            </h3>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                              {t('divisionCompaniesCardSector')}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-1 flex-col px-5 py-4">
                          {excerpt ? (
                            <p className="flex-1 text-sm leading-relaxed text-slate-600">{excerpt}</p>
                          ) : (
                            <p className="flex-1 text-sm italic text-slate-400">{t('divisionCompaniesNoDescription')}</p>
                          )}
                          <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 group-hover:text-blue-900">
                            {t('divisionCompaniesViewProfile')}
                            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
