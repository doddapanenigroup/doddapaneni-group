import { createTranslator } from '@/lib/translation-format';
import { getDictionary } from '@/lib/translations';
import Link from 'next/link';
import { ArrowLeft, Building2 } from 'lucide-react';
import { COMPANY_DIVISION_NAV_LABELS, type CompanyDivisionSlug } from '@/lib/company-divisions';
import { publicPathWithLocale } from '@/lib/sector-landing';

type Props = {
  locale: string;
  slug: CompanyDivisionSlug;
};

/**
 * Shown when a URL matches a known division slug but the sector is not yet in the database,
 * so the public hub cannot load. Avoids a bare 404 for bookmarked or marketed URLs.
 */
export default async function SectorUnavailable({ locale, slug }: Props) {
  const label = COMPANY_DIVISION_NAV_LABELS[slug];
  const homeHref = publicPathWithLocale(locale);
  const blogHref = publicPathWithLocale(locale, 'news');
  const t = createTranslator(getDictionary(locale), 'Blog');

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-blue-900 px-4 py-16 sm:px-6 md:py-20 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white">
            <Building2 className="h-8 w-8" aria-hidden />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">Doddapaneni Group</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">{label}</h1>
          <p className="mt-4 text-base leading-relaxed text-blue-100 sm:text-lg">
            This division hub is being prepared. The page will go live once the sector is published in our systems.
            Meanwhile, you can browse {t('title').toLowerCase()} or return to the homepage.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href={homeHref}
              className="inline-flex items-center rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-blue-900 shadow-sm transition-colors hover:bg-blue-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
              Back to home
            </Link>
            <Link
              href={blogHref}
              className="inline-flex items-center rounded-lg border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              {t('browseAllNews')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
