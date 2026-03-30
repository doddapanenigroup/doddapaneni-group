'use client';

import { Link } from '@/i18n/routing';
import { ArrowRight } from 'lucide-react';
import { m } from 'framer-motion';
import MotionLazy from '@/components/motion/MotionLazy';
import { useTranslations } from 'next-intl';
import type { HomeDivision } from '@/lib/business-divisions-home';

type Props = { divisions: HomeDivision[] };

export default function HomeDivisionsGrid({ divisions }: Props) {
  const t = useTranslations('Home');

  return (
    <MotionLazy>
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
              href="/#business-divisions"
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
  );
}
