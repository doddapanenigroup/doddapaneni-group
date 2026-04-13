'use client';

import { Target, Eye, Award, Building2, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { m } from 'framer-motion';
import MotionLazy from '@/components/motion/MotionLazy';
import { useTranslations } from '@/lib/dictionary-react';
import { Link } from '@/i18n/navigation';
import { mediaUrl } from '@/lib/media';
import { getCompanyDivisionNavItems } from '@/lib/company-divisions';

const DIVISIONS_NAV = getCompanyDivisionNavItems();

export default function About() {
  const t = useTranslations('About');

  const values = [
    t('valuesList.integrity'),
    t('valuesList.transparency'),
    t('valuesList.customerFocus'),
    t('valuesList.innovation'),
    t('valuesList.operationalExcellence'),
    t('valuesList.sustainableGrowth'),
  ];

  return (
      <MotionLazy>
      <div className="min-h-screen bg-white">
        <section className="bg-blue-900 px-4 py-6 sm:px-6 md:py-10 lg:px-8">
          <div className="mx-auto max-w-6xl text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-300 sm:text-xs">
              Doddapaneni Group
            </p>
            <h1 className="mt-2 text-xl font-bold text-white sm:mt-3 sm:text-2xl md:text-3xl lg:text-4xl">
              {t('headerTitle')}
            </h1>
            <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-blue-100 sm:mt-4 sm:text-base md:text-lg">
              {t('headerSubtitle')}
            </p>
          </div>
        </section>

        <section className="bg-white px-4 py-8 sm:px-6 md:py-16 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">
              <m.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <span className="mb-4 inline-block h-0.5 w-12 rounded-full bg-blue-800" />
                <h2 className="mb-3 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl md:text-3xl">
                  {t('introTitle')}
                </h2>
                <p className="text-base leading-relaxed text-slate-700 md:text-lg">{t('introText')}</p>
              </m.div>
              <m.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="relative aspect-[4/3] w-full min-h-[12.5rem] overflow-hidden rounded-xl border border-blue-100 bg-slate-100"
              >
                <Image
                  src={mediaUrl('about.webp')}
                  alt={t('introImageAlt')}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  loading="lazy"
                />
              </m.div>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 px-4 py-8 sm:px-6 md:py-16 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 grid gap-4 sm:gap-8 md:mb-12 md:grid-cols-2">
              <m.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="rounded-xl border border-blue-800/20 bg-blue-900 p-5 text-white sm:p-8"
              >
                <div className="mb-3 flex items-start gap-3 sm:mb-4 sm:gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15 sm:h-12 sm:w-12">
                    <Eye className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.75} aria-hidden />
                  </div>
                  <h3 className="pt-0.5 text-lg font-bold sm:pt-1 sm:text-xl">{t('visionTitle')}</h3>
                </div>
                <p className="text-sm leading-relaxed text-blue-100 sm:text-base">{t('visionText')}</p>
              </m.div>
              <m.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.08 }}
                className="rounded-xl border border-blue-800/20 bg-blue-900 p-5 text-white sm:p-8"
              >
                <div className="mb-3 flex items-start gap-3 sm:mb-4 sm:gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15 sm:h-12 sm:w-12">
                    <Target className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.75} aria-hidden />
                  </div>
                  <h3 className="pt-0.5 text-lg font-bold sm:pt-1 sm:text-xl">{t('missionTitle')}</h3>
                </div>
                <p className="text-sm leading-relaxed text-blue-100 sm:text-base">{t('missionText')}</p>
              </m.div>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-white px-4 py-8 sm:px-6 md:py-16 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex flex-col gap-3 sm:mb-10 md:mb-12 md:flex-row md:items-end md:justify-between md:gap-8">
              <div>
                <div className="mb-2 flex items-center gap-2 text-blue-900">
                  <Building2 className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-800">Portfolio</span>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl md:text-3xl">
                  {t('divisionsTitle')}
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">{t('divisionsSubtitle')}</p>
              </div>
            </div>
            <p className="mb-8 max-w-3xl text-sm leading-relaxed text-slate-700 sm:text-base md:mb-10">
              {t('divisionsLead')}
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-5">
              {DIVISIONS_NAV.map((item, index) => {
                const blurb = t(`divisionBlurbs.${item.slug}` as `divisionBlurbs.${typeof item.slug}`);
                return (
                  <m.article
                    key={item.slug}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: index * 0.03 }}
                    className={`flex flex-col rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${
                      item.active ? 'border-slate-200' : 'border-dashed border-slate-200/90 bg-slate-50/30'
                    }`}
                  >
                    <h3 className="text-sm font-bold text-slate-900 sm:text-base">{item.label}</h3>
                    <p className="mt-2 flex-1 text-xs leading-relaxed text-slate-600 sm:text-sm">{blurb}</p>
                    {item.active ? (
                      <Link
                        href={`/${item.slug}`}
                        className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-800 hover:text-blue-950 sm:text-sm"
                      >
                        {t('exploreHub')}
                        <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      </Link>
                    ) : (
                      <span className="mt-4 inline-flex w-fit rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        {t('comingSoonBadge')}
                      </span>
                    )}
                  </m.article>
                );
              })}
            </div>
            <p className="mt-10 text-center text-sm text-slate-600 sm:mt-12">
              {t('divisionsCta')}{' '}
              <Link
                href="/#business-divisions"
                className="font-semibold text-blue-800 underline-offset-2 hover:underline"
              >
                {t('divisionsCtaLink')}
              </Link>
            </p>
          </div>
        </section>

        <section className="bg-slate-50 px-4 py-8 sm:px-6 md:py-16 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 text-center md:mb-8">
              <span className="mx-auto mb-2 inline-block h-0.5 w-12 rounded-full bg-blue-800 sm:mb-3" />
              <h2 className="mb-2 text-xl font-bold text-slate-900 sm:text-2xl md:text-3xl">{t('valuesTitle')}</h2>
              <p className="mx-auto max-w-xl text-sm text-slate-600 sm:text-base">{t('valuesSubtitle')}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {values.map((value, index) => (
                <m.div
                  key={value}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 rounded-xl border border-blue-100 bg-white p-4 text-slate-800 transition-all duration-300 hover:border-blue-200 hover:bg-blue-50/50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-800 text-white">
                    <Award size={18} strokeWidth={1.75} aria-hidden />
                  </div>
                  <span className="text-sm font-semibold">{value}</span>
                </m.div>
              ))}
            </div>
          </div>
        </section>
      </div>
      </MotionLazy>
  );
}
