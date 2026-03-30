'use client';

import { Building2, Landmark, Network } from 'lucide-react';
import { m } from 'framer-motion';
import MotionLazy from '@/components/motion/MotionLazy';
import { useTranslations } from 'next-intl';

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
      </div>
    </MotionLazy>
  );
}
