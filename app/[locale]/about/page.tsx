"use client";

import { Target, Eye, Award } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import ContentPage from '@/components/ContentPage';

export default function About() {
  const locale = useLocale();
  const t = useTranslations('About');


  const values = [
    t('valuesList.integrity'),
    t('valuesList.transparency'),
    t('valuesList.customerFocus'),
    t('valuesList.innovation'),
    t('valuesList.operationalExcellence'),
    t('valuesList.sustainableGrowth')
  ];

  return (
    <ContentPage pageKey="about" locale={locale}>
    <div className="min-h-screen bg-white">
      {/* Page heading – small blue strip */}
      <section className="bg-blue-900 py-6 md:py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{t('headerTitle')}</h1>
          <p className="mt-2 text-blue-200 text-sm md:text-base max-w-2xl mx-auto">{t('headerSubtitle')}</p>
        </div>
      </section>

      {/* Intro */}
      <section className="py-8 md:py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-block w-12 h-0.5 rounded-full bg-blue-800 mb-4" />
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-3 sm:mb-4 tracking-tight">
                {t('introTitle')}
              </h2>
              <p className="text-slate-700 text-base md:text-lg leading-relaxed">
                {t('introText')}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative rounded-xl overflow-hidden border border-blue-100 aspect-[4/3]"
            >
              <Image
                src="/about.webp"
                alt="Strategic Meeting"
                fill
                className="object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-8 md:py-16 px-4 sm:px-6 lg:px-8 bg-blue-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-4 sm:gap-8 mb-8 md:mb-12">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="bg-blue-900 p-5 sm:p-8 rounded-xl text-white border border-blue-800"
            >
              <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-white/20 flex items-center justify-center text-white">
                  <Eye className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.75} />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white pt-0.5 sm:pt-1">{t('visionTitle')}</h3>
              </div>
              <p className="text-blue-200 text-sm sm:text-base leading-relaxed">
                {t('visionText')}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-blue-900 p-5 sm:p-8 rounded-xl text-white border border-blue-800"
            >
              <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-white/20 flex items-center justify-center text-white">
                  <Target className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.75} />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white pt-0.5 sm:pt-1">{t('missionTitle')}</h3>
              </div>
              <p className="text-blue-200 text-sm sm:text-base leading-relaxed">
                {t('missionText')}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-8 md:py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6 md:mb-8">
            <span className="inline-block w-12 h-0.5 rounded-full bg-blue-800 mx-auto mb-2 sm:mb-3" />
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-2">{t('valuesTitle')}</h2>
            <p className="text-slate-600 max-w-xl mx-auto text-sm">{t('valuesSubtitle')}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100 text-slate-800 hover:bg-blue-100 hover:border-blue-200 transition-all duration-300"
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-blue-800 flex items-center justify-center text-white">
                  <Award size={18} strokeWidth={1.75} />
                </div>
                <span className="text-sm font-semibold">{value}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
    </ContentPage>
  );
}
