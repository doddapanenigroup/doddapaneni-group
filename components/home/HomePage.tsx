'use client';

import dynamic from 'next/dynamic';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { ArrowRight, Sparkles } from 'lucide-react';
import { m } from 'framer-motion';
import MotionLazy from '@/components/motion/MotionLazy';
import { useTranslations } from 'next-intl';
import ContentPage from '@/components/ContentPage';
import { mediaUrl } from '@/lib/media';
import type { HomeDivision } from '@/lib/business-divisions-home';

const BANNER_IMAGE = mediaUrl('image.webp');

const HomePageBelowFold = dynamic(() => import('./HomePageBelowFold'), {
  loading: () => (
    <div
      className="min-h-[52rem] bg-[linear-gradient(180deg,rgba(248,250,252,0.6)_0%,transparent_18%,transparent_100%)]"
      aria-hidden
    />
  ),
});

type Props = {
  locale: string;
  divisions: HomeDivision[];
};

export default function HomePage({ locale, divisions }: Props) {
  const t = useTranslations('Home');

  return (
    <ContentPage pageKey="home" locale={locale}>
      <div className="flex min-h-screen flex-col bg-white">
        {/* Hero — CSS motion avoids framer on LCP path */}
        <section className="relative overflow-hidden px-4 pt-20 pb-14 text-white sm:px-6 sm:pt-24 sm:pb-16 md:pt-28 md:pb-20 lg:px-8">
          <div className="absolute inset-0 z-0">
            <Image
              src={BANNER_IMAGE}
              alt={t('heroImageAlt')}
              fill
              sizes="100vw"
              className="object-cover opacity-45"
              priority
              fetchPriority="high"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/95 to-blue-950/90" />
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{ backgroundImage: `url(${mediaUrl('grid.svg')})` }}
            />
            <div className="absolute -right-24 top-1/4 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl">
            <div className="home-hero-enter max-w-4xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur-md sm:mb-5 sm:px-4">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" aria-hidden />
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100 sm:text-sm">
                  {t('hubHeroEyebrow')}
                </span>
              </div>
              <h1 className="mb-4 font-serif text-4xl font-bold tracking-tight text-white sm:mb-5 sm:text-5xl md:text-6xl lg:text-7xl">
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

        <MotionLazy>
          {/* 12 divisions grid */}
          <section
            id="business-divisions"
            className="scroll-mt-20 border-b border-slate-100 bg-slate-50/80 px-4 py-14 sm:px-6 sm:py-16 md:py-20 lg:px-8"
            aria-labelledby="divisions-heading"
          >
            <div className="mx-auto max-w-7xl">
              <header className="mb-10 max-w-3xl md:mb-12">
                <h2
                  id="divisions-heading"
                  className="font-serif text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-[2.5rem]"
                >
                  {t('divisionsSectionTitle')}
                </h2>
                <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
                  {t('divisionsSectionSubtitle')}
                </p>
              </header>

              <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                {divisions.map((d, index) => (
                  <m.li
                    key={d.slug}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.24) }}
                  >
                    <article
                      className={
                        d.active
                          ? 'flex h-full flex-col rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_4px_24px_-6px_rgba(15,23,42,0.12)] transition duration-300 hover:border-blue-200/80 hover:shadow-[0_12px_40px_-12px_rgba(30,58,138,0.18)]'
                          : 'flex h-full flex-col rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 shadow-sm'
                      }
                    >
                      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                        <h3 className="text-lg font-bold leading-snug text-slate-900">{d.name}</h3>
                        {!d.active ? (
                          <span className="shrink-0 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900 sm:text-xs">
                            {t('launchingSoon')}
                          </span>
                        ) : null}
                      </div>
                      <p
                        className={
                          d.active
                            ? 'mb-6 flex-1 text-sm leading-relaxed text-slate-600 sm:text-[0.9375rem]'
                            : 'mb-6 flex-1 text-sm leading-relaxed text-slate-500 sm:text-[0.9375rem]'
                        }
                      >
                        {d.description}
                      </p>
                      {d.active ? (
                        <Link
                          href={`/${d.slug}`}
                          className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                        >
                          {t('viewCompany')}
                          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                        </Link>
                      ) : (
                        <span
                          className="mt-auto inline-flex w-full cursor-not-allowed items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-400"
                          aria-disabled="true"
                        >
                          {t('launchingSoon')}
                        </span>
                      )}
                    </article>
                  </m.li>
                ))}
              </ul>

              <p className="mt-12 text-center text-sm text-slate-500">
                <Link
                  href="/services"
                  className="font-semibold text-blue-800 underline-offset-4 hover:text-blue-950 hover:underline"
                >
                  {t('divisionsFooterServices')}
                </Link>
                <span className="mx-2 text-slate-300">·</span>
                <span>{t('diverseSolutions')}</span>
              </p>
            </div>
          </section>
        </MotionLazy>

        <HomePageBelowFold />
      </div>
    </ContentPage>
  );
}
