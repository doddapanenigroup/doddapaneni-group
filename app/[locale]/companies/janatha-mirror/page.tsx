"use client";

import Image from 'next/image';
import { m } from 'framer-motion';
import MotionLazy from '@/components/motion/MotionLazy';
import { Newspaper, Globe, Video, Share2, Youtube, Facebook } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import ContentPage from '@/components/ContentPage';
import { mediaUrl } from '@/lib/media';

export default function JanathaMirror() {
  const locale = useLocale();
  const t = useTranslations('JanathaMirror');

  const features = [
    { key: "unbiasedReporting", icon: <Newspaper size={24} strokeWidth={1.75} /> },
    { key: "digitalFirst", icon: <Globe size={24} strokeWidth={1.75} /> },
    { key: "multimediaContent", icon: <Video size={24} strokeWidth={1.75} /> },
    { key: "globalPerspective", icon: <Share2 size={24} strokeWidth={1.75} /> }
  ];

  return (
    <ContentPage pageKey="companies-janatha-mirror" locale={locale}>
    <MotionLazy>
    <div className="min-h-screen bg-white">
      {/* Page heading – small blue strip; extra top padding so fixed navbar doesn't overlap logo */}
      <section className="bg-blue-900 pt-24 pb-8 md:pt-24 md:pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <Image
            src={mediaUrl('janathamirror.webp')}
            alt="Janatha Mirror Logo"
            width={140}
            height={56}
            className="h-12 w-auto object-contain rounded overflow-hidden mx-auto"
          />
          <p className="mt-2 text-blue-200 text-sm max-w-2xl mx-auto">{t('subtitle')}</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-blue-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-12">
            <m.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-block w-12 h-0.5 rounded-full bg-blue-800 mb-4" />
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 tracking-tight">
                {t('sectionTitle')}
              </h2>
              <p className="text-slate-700 text-base leading-relaxed mb-4">{t('p1')}</p>
              <p className="text-slate-700 text-base leading-relaxed">{t('p2')}</p>
            </m.div>
            <m.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative rounded-xl overflow-hidden border border-blue-200 aspect-[4/3]"
            >
              <Image
                src={mediaUrl('news.webp')}
                alt="Journalist working"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                loading="lazy"
              />
            </m.div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <m.div
                key={index}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="bg-white p-5 rounded-xl border border-blue-200 hover:border-blue-600 hover:shadow-md transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-800 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{t(`features.${feature.key}.title`)}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{t(`features.${feature.key}.description`)}</p>
              </m.div>
            ))}
          </div>

          {/* Social links – bottom of page */}
          <div className="mt-16 pt-10 border-t border-blue-200 flex flex-wrap items-center justify-center gap-4">
            <span className="text-slate-600 text-sm font-medium">{t('followUs')}</span>
            <a
              href="https://www.youtube.com/@janathamirror8181"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-11 h-11 rounded-xl bg-white border border-blue-200 hover:border-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
              aria-label="Janatha Mirror on YouTube"
            >
              <Youtube size={24} strokeWidth={1.75} className="text-[#FF0000]" />
            </a>
            <a
              href="https://www.facebook.com/janathamirrornews"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-11 h-11 rounded-xl bg-white border border-blue-200 hover:border-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
              aria-label="Janatha Mirror on Facebook"
            >
              <Facebook size={24} strokeWidth={1.75} className="text-[#1877F2]" />
            </a>
          </div>
        </div>
      </section>
    </div>
    </MotionLazy>
    </ContentPage>
  );
}
