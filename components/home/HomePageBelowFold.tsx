'use client';

import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { Building2, Landmark, Network } from 'lucide-react';
import { m } from 'framer-motion';
import MotionLazy from '@/components/motion/MotionLazy';
import { useTranslations } from 'next-intl';
import { mediaUrl } from '@/lib/media';

export default function HomePageBelowFold() {
  const t = useTranslations('Home');

  return (
    <MotionLazy>
      <div className="home-below-fold">
        <section
          className="border-b border-slate-100 bg-white px-4 py-14 sm:px-6 sm:py-16 md:py-20 lg:px-8"
          aria-labelledby="leadership-heading"
        >
          <div className="mx-auto max-w-7xl">
            <header className="mb-10 max-w-3xl md:mb-12">
              <h2
                id="leadership-heading"
                className="font-serif text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
              >
                {t('leadershipTitle')}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
                {t('leadershipSubtitle')}
              </p>
            </header>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
              {[
                {
                  title: t('leadershipGovTitle'),
                  body: t('leadershipGovBody'),
                  icon: Landmark,
                },
                {
                  title: t('leadershipExecTitle'),
                  body: t('leadershipExecBody'),
                  icon: Building2,
                },
                {
                  title: t('leadershipDivTitle'),
                  body: t('leadershipDivBody'),
                  icon: Network,
                },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <m.article
                    key={item.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/80 to-white p-6 shadow-sm sm:p-8"
                  >
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-900 text-white shadow-md">
                      <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                    </div>
                    <h3 className="mb-3 text-lg font-bold text-slate-900">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-600 sm:text-base">{item.body}</p>
                  </m.article>
                );
              })}
            </div>
          </div>
        </section>

        <section
          className="bg-white px-4 py-12 sm:px-6 sm:py-14 lg:px-8"
          aria-labelledby="home-brands-heading"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 text-center md:mb-10">
              <h2
                id="home-brands-heading"
                className="mb-2 font-serif text-2xl font-bold text-slate-900 sm:text-3xl"
              >
                {t('ourGroupCompanies')}
              </h2>
              <p className="text-sm text-slate-600 sm:text-base">{t('drivingExcellence')}</p>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50 py-4 md:py-6">
              <div className="absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent sm:w-24" />
              <div className="absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent sm:w-24" />
              <div className="flex">
                <m.div
                  className="flex flex-nowrap items-center gap-8 pr-8 sm:gap-16 sm:pr-16 md:gap-24 md:pr-24"
                  animate={{ x: '-50%' }}
                  transition={{ repeat: Infinity, ease: 'linear', duration: 32 }}
                >
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex shrink-0 items-center gap-8 sm:gap-16 md:gap-24">
                      {[
                        { src: mediaUrl('dlsin.webp'), link: '/companies/dlsin', alt: t('logoAltDlsin') },
                        {
                          src: mediaUrl('janathamirror.webp'),
                          link: '/companies/janatha-mirror',
                          alt: t('logoAltJanathaMirror'),
                        },
                        { src: mediaUrl('dealsmedi.webp'), link: '/companies/dealsmedi', alt: t('logoAltDealsmedi') },
                      ].map((logo, index) => (
                        <Link
                          key={`${i}-${index}`}
                          href={logo.link}
                          className="relative h-16 w-28 shrink-0 opacity-90 transition-all duration-300 hover:scale-105 hover:opacity-100 sm:h-20 sm:w-36 md:h-24 md:w-40"
                        >
                          <Image
                            src={logo.src}
                            alt={logo.alt}
                            fill
                            sizes="(max-width: 640px) 112px, 160px"
                            className="object-contain"
                            loading="lazy"
                          />
                        </Link>
                      ))}
                    </div>
                  ))}
                </m.div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MotionLazy>
  );
}
