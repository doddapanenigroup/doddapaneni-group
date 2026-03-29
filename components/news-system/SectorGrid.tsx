import { Link } from '@/i18n/routing';
import type { NewsSector } from '@/lib/doddapaneni-news';

type Props = {
  locale: string;
  sectors: NewsSector[];
};

export default function SectorGrid({ locale, sectors }: Props) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6 lg:px-8 lg:pb-16">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sectors.map((sector) => (
          <Link
            key={sector.slug}
            href={`/doddapaneni/${sector.slug}/news`}
            locale={locale}
            className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
          >
            <h2 className="text-base font-semibold tracking-tight text-slate-900 group-hover:text-blue-900 md:text-lg">
              {sector.name}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{sector.shortDescription}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
