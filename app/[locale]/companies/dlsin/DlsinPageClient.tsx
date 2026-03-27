"use client";

import Image from 'next/image';
import { m } from 'framer-motion';
import MotionLazy from '@/components/motion/MotionLazy';
import { Globe, Truck, CreditCard, Users } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { mediaUrl } from '@/lib/media';

export default function DlsinPageClient() {
  const locale = useLocale();
  const t = useTranslations('Dlsin');

  const features = [
    { key: "globalMarketplace", icon: <Globe size={24} strokeWidth={1.75} /> },
    { key: "securePayments", icon: <CreditCard size={24} strokeWidth={1.75} /> },
    { key: "fastLogistics", icon: <Truck size={24} strokeWidth={1.75} /> },
    { key: "vendorTools", icon: <Users size={24} strokeWidth={1.75} /> }
  ];

  return (
    <MotionLazy>
    <div className="min-h-screen bg-white">
      {/* Page heading – small blue strip; extra top padding so fixed navbar doesn't overlap logo */}
      <section className="bg-blue-900 pt-24 pb-8 md:pt-24 md:pb-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl text-center">
          <div className="relative mx-auto h-12 w-[120px] overflow-hidden rounded">
            <Image
              src={mediaUrl('dlsin.webp')}
              alt="Dlsin Logo"
              fill
              className="object-contain"
              sizes="120px"
            />
          </div>
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
              className="relative aspect-[4/3] w-full min-h-[12.5rem] overflow-hidden rounded-xl border border-blue-200 bg-slate-100"
            >
              <Image
                src={mediaUrl('ecommerce.webp')}
                alt="Ecommerce"
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
        </div>
      </section>
    </div>
    </MotionLazy>
  );
}
