import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { AppLocale } from '@/i18n/locales';

/** Static asset in `public/` — plain `img` avoids `/_next/image` so the browser can fetch LCP bytes immediately. */
const BANNER_IMAGE = '/image.webp';

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
 * Links use `next/link` with explicit `/${locale}/…` paths (same as localized `Link`).
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
    <section className="relative min-h-[22rem] overflow-hidden px-4 pt-20 pb-14 text-white sm:min-h-[26rem] sm:px-6 sm:pt-24 sm:pb-16 md:min-h-[28rem] md:pt-28 md:pb-20 lg:px-8">
      <div className="absolute inset-0 z-0 bg-slate-900">
        <img
          src={BANNER_IMAGE}
          alt={heroImageAlt}
          width={1920}
          height={1080}
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
          <h1 className="mb-4 font-sans text-4xl font-bold tracking-tight text-white sm:mb-5 sm:text-5xl md:text-6xl lg:text-7xl">
            {hubHeroTitle}
          </h1>
          <p className="mb-3 text-lg font-medium tracking-wide text-blue-200/95 sm:text-xl md:text-2xl">{hubHeroSubtitle}</p>
          <p className="mb-8 max-w-2xl text-base leading-relaxed text-slate-300 sm:mb-10 sm:text-lg md:text-xl">{hubHeroLead}</p>
          <div className="flex flex-wrap gap-3 sm:gap-4">
            <a
              href="#business-divisions"
              className="inline-flex items-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-xl shadow-black/20 transition hover:bg-blue-50 sm:px-8 sm:text-base"
            >
              {businessDivisions}
              <ArrowRight className="ml-2 h-4 w-4 shrink-0" aria-hidden />
            </a>
            <Link
              href={`/${locale}/about`}
              className="inline-flex items-center rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/15 sm:px-8 sm:text-base"
            >
              {learnAboutUs}
            </Link>
            <Link
              href={`/${locale}/contact`}
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
