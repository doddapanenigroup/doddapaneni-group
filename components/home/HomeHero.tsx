import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { AppLocale } from '@/i18n/locales';
import { publicPathWithLocale } from '@/lib/public-path-with-locale';

/** Plain `img` + `srcSet` avoids `/_next/image` so the browser can fetch LCP bytes immediately at an appropriate width. */
const HERO_SRC_DEFAULT = '/image-hero-960.webp';
const HERO_SRC_SET = '/image-hero-480.webp 480w, /image-hero-960.webp 960w, /image.webp 1500w';

export type HomeHeroCopy = {
  heroImageAlt: string;
  hubHeroTitle: string;
  hubHeroSubtitle: string;
  hubHeroLead: string;
  businessDivisions: string;
  learnAboutUs: string;
  getInTouch: string;
};

type Props = {
  locale: AppLocale;
  copy: HomeHeroCopy;
};

/**
 * Server-rendered hero so LCP paints without waiting for the home client bundle.
 * Links use `next/link` with locale-aware public paths (English has no `/en` prefix).
 */
export default function HomeHero({ locale, copy }: Props) {
  const {
    heroImageAlt,
    hubHeroTitle,
    hubHeroSubtitle,
    hubHeroLead,
    businessDivisions,
    learnAboutUs,
    getInTouch,
  } = copy;

  return (
    <section className="relative min-h-[18rem] overflow-hidden px-4 pt-20 pb-10 text-white sm:min-h-[20rem] sm:px-6 sm:pt-20 sm:pb-12 md:min-h-[22rem] md:pt-20 md:pb-14 lg:px-8">
      <div className="absolute inset-0 z-0 bg-slate-900">
        <img
          src={HERO_SRC_DEFAULT}
          srcSet={HERO_SRC_SET}
          sizes="100vw"
          alt={heroImageAlt}
          width={960}
          height={640}
          decoding="async"
          fetchPriority="high"
          className="h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/95 to-blue-950/90" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'url(/grid.svg)' }}
        />
        <div className="absolute -right-24 top-1/4 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="home-hero-enter max-w-4xl">
          <h1 className="mb-3 font-serif text-3xl font-bold tracking-tight text-white sm:mb-4 sm:text-4xl md:text-5xl lg:text-6xl">
            {hubHeroTitle}
          </h1>
          <p className="mb-2 text-base font-medium tracking-wide text-blue-200/95 sm:text-lg md:text-xl">{hubHeroSubtitle}</p>
          <p className="mb-6 max-w-2xl text-sm leading-relaxed text-slate-300 sm:mb-8 sm:text-base md:text-lg">{hubHeroLead}</p>
          <div className="flex flex-wrap gap-3 sm:gap-4">
            <a
              href="#business-divisions"
              className="inline-flex items-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-xl shadow-black/20 transition hover:bg-blue-50 sm:px-8 sm:text-base"
            >
              {businessDivisions}
              <ArrowRight className="ml-2 h-4 w-4 shrink-0" aria-hidden />
            </a>
            <Link
              href={publicPathWithLocale(locale, 'about')}
              className="inline-flex items-center rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/15 sm:px-8 sm:text-base"
            >
              {learnAboutUs}
            </Link>
            <Link
              href={publicPathWithLocale(locale, 'contact')}
              className="inline-flex items-center rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white/95 transition hover:border-white/40 sm:px-8 sm:text-base"
            >
              {getInTouch}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
