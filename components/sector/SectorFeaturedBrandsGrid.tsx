import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { getFeaturedBrandsForSector } from '@/lib/sector-featured-companies';

type Props = {
  locale: string;
  sectorSlug: string;
  /** When true, use compact top border (e.g. under hero on full hub pages). */
  bordered?: boolean;
};

export default async function SectorFeaturedBrandsGrid({ locale, sectorSlug, bordered }: Props) {
  const featuredBrands = getFeaturedBrandsForSector(sectorSlug);
  if (featuredBrands.length === 0) {
    return null;
  }

  const tHome = await getTranslations({ locale, namespace: 'Home' });
  const tSectorBrands = await getTranslations({ locale, namespace: 'SectorLanding' });

  return (
    <section
      aria-labelledby="sector-featured-brands-heading"
      className={`bg-slate-50/80 px-4 py-12 sm:px-6 lg:px-8 ${bordered ? 'border-b border-slate-200' : ''}`}
    >
      <div className="mx-auto max-w-7xl">
        <h2
          id="sector-featured-brands-heading"
          className="mb-2 text-center font-serif text-2xl font-bold text-slate-900 sm:text-left sm:text-3xl"
        >
          {tSectorBrands('featuredProductsHeading')}
        </h2>
        <p className="mb-8 text-center text-sm text-slate-600 sm:text-left sm:text-base">
          {tSectorBrands('featuredProductsLead')}
        </p>

        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {featuredBrands.map((brand) => (
            <li key={brand.href}>
              <Link
                href={brand.href}
                locale={locale}
                className="flex min-h-[9rem] items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:border-blue-200 hover:shadow-md"
              >
                <div className="relative h-20 w-full max-w-[11rem] sm:h-24 sm:max-w-[12rem]">
                  <Image
                    src={brand.imageSrc}
                    alt={tHome(brand.altKey)}
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 176px, 192px"
                    loading="lazy"
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
