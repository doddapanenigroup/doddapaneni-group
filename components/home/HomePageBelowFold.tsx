'use client';

import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { Building2, Landmark, MapPin, Network } from 'lucide-react';
import { m } from 'framer-motion';
import MotionLazy from '@/components/motion/MotionLazy';
import { useTranslations } from 'next-intl';
import { mediaUrl } from '@/lib/media';

function GlobalPresenceIllustration({ ariaLabel }: { ariaLabel: string }) {
  return (
    <div
      className="relative flex h-full min-h-[240px] items-center justify-center overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-blue-50/50 shadow-inner sm:min-h-[280px] lg:min-h-[320px]"
      role="img"
      aria-label={ariaLabel}
    >
      <svg
        className="absolute inset-0 h-full w-full text-slate-200/90"
        viewBox="0 0 800 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          opacity="0.35"
          d="M40 210c80-40 160 20 240-10s120-90 200-60 200 80 280 40"
          stroke="currentColor"
          strokeWidth="0.75"
        />
        <path
          opacity="0.25"
          d="M60 320c100 20 180-60 280-40s160 100 260 60 140-80 200-120"
          stroke="currentColor"
          strokeWidth="0.75"
        />
        <circle cx="520" cy="160" r="120" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
        <circle cx="280" cy="240" r="90" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
      </svg>
      <div className="relative z-[1] grid w-full max-w-md grid-cols-2 gap-8 px-6 py-8 sm:gap-10 sm:px-10">
        <div className="flex flex-col items-center text-center">
          <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-900/20 sm:h-14 sm:w-14">
            <MapPin className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.75} aria-hidden />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">IN</span>
        </div>
        <div className="flex flex-col items-center text-center">
          <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/25 sm:h-14 sm:w-14">
            <MapPin className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.75} aria-hidden />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">USA</span>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/90 to-transparent" />
    </div>
  );
}

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
          className="bg-slate-50 px-4 py-14 sm:px-6 sm:py-16 md:py-20 lg:px-8"
          aria-labelledby="presence-heading"
        >
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
              <div>
                <h2
                  id="presence-heading"
                  className="font-serif text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
                >
                  {t('presenceTitle')}
                </h2>
                <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
                  {t('presenceSubtitle')}
                </p>
                <ul className="mt-8 space-y-6">
                  <li className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                      <MapPin className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-blue-800">
                        {t('presenceIndiaLabel')}
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">{t('presenceIndiaLoc')}</p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">{t('presenceIndiaDesc')}</p>
                    </div>
                  </li>
                  <li className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                      <MapPin className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                        {t('presenceUsLabel')}
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">{t('presenceUsLoc')}</p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">{t('presenceUsDesc')}</p>
                    </div>
                  </li>
                </ul>
              </div>
              <GlobalPresenceIllustration ariaLabel={t('presenceMapAria')} />
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
