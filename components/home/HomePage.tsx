'use client';

import dynamic from 'next/dynamic';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from '@/lib/dictionary-react';
import type { HomeDivision } from '@/lib/business-divisions-home';

/** Static `public/` path: avoids `/api/media` hop so the image optimizer reads from disk in one step. */
const BANNER_IMAGE = '/image.webp';

const HomeDivisionsGrid = dynamic(() => import('./HomeDivisionsGrid'), {
  loading: () => (
    <div
      className="min-h-[48rem] border-b border-slate-100 bg-slate-50/80"
      aria-hidden
    />
  ),
});

const HomePageBelowFold = dynamic(() => import('./HomePageBelowFold'), {
  loading: () => (
    <div
      className="flex min-h-[52rem] flex-col items-center bg-[linear-gradient(180deg,rgba(248,250,252,0.6)_0%,transparent_18%,transparent_100%)] pt-20"
      role="status"
      aria-busy="true"
      aria-label="Loading page sections"
    >
      <div
        className="h-9 w-9 animate-spin rounded-full border-2 border-blue-700 border-t-transparent"
        aria-hidden
      />
      <span className="mt-4 text-sm font-medium text-slate-500">Loading…</span>
    </div>
  ),
});

type Props = {
  divisions: HomeDivision[];
};

export default function HomePage({ divisions }: Props) {
  const t = useTranslations('Home');

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Hero — sans heading + priority image = faster LCP; serif reserved for below-fold headings */}
      <section className="relative min-h-[22rem] overflow-hidden px-4 pt-20 pb-14 text-white sm:min-h-[26rem] sm:px-6 sm:pt-24 sm:pb-16 md:min-h-[28rem] md:pt-28 md:pb-20 lg:px-8">
        <div className="absolute inset-0 z-0 bg-slate-900">
          <Image
            src={BANNER_IMAGE}
            alt={t('heroImageAlt')}
            fill
            sizes="100vw"
            quality={68}
            className="object-cover opacity-45"
            priority
            fetchPriority="high"
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
              {t('hubHeroTitle')}
            </h1>
            <p className="mb-3 text-lg font-medium tracking-wide text-blue-200/95 sm:text-xl md:text-2xl">
              {t('hubHeroSubtitle')}
            </p>
            <p className="mb-8 max-w-2xl text-base leading-relaxed text-slate-300 sm:mb-10 sm:text-lg md:text-xl">
              {t('hubHeroLead')}
            </p>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <a
                href="#business-divisions"
                className="inline-flex items-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-xl shadow-black/20 transition hover:bg-blue-50 sm:px-8 sm:text-base"
              >
                {t('businessDivisions')}
                <ArrowRight className="ml-2 h-4 w-4 shrink-0" aria-hidden />
              </a>
              <Link
                href="/about"
                className="inline-flex items-center rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/15 sm:px-8 sm:text-base"
              >
                {t('learnAboutUs')}
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white/95 transition hover:border-white/40 sm:px-8 sm:text-base"
              >
                {t('getInTouch')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <HomeDivisionsGrid divisions={divisions} />

      <HomePageBelowFold />
    </div>
  );
}
