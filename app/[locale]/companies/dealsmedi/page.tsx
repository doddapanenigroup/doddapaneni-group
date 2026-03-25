"use client";

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Stethoscope, Truck, BedDouble, Pill, ExternalLink, Facebook, Youtube, Instagram, Twitter } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import ContentPage from '@/components/ContentPage';

const WEBSITE_URL = 'https://dealsmedi.com/';

const DEALSMEDI_SOCIAL = {
  facebook: 'https://www.facebook.com/profile.php?id=61582923667373',
  x: 'https://x.com/dealsmedi',
  instagram: 'https://www.instagram.com/dealsmedi/',
  youtube: 'https://www.youtube.com/@dealsmedi',
  pinterest: 'https://in.pinterest.com/dealsmedi/',
};

export default function DealsMedi() {
  const locale = useLocale();
  const t = useTranslations('DealsMedi');

  const features = [
    { key: "respiratory", icon: <Stethoscope size={24} strokeWidth={1.75} /> },
    { key: "mobility", icon: <Truck size={24} strokeWidth={1.75} /> },
    { key: "bedsAndChairs", icon: <BedDouble size={24} strokeWidth={1.75} /> },
    { key: "prescriptionAndOTC", icon: <Pill size={24} strokeWidth={1.75} /> }
  ];

  return (
    <ContentPage pageKey="companies-dealsmedi" locale={locale}>
    <div className="min-h-screen bg-white">
      {/* Page heading – small blue strip; extra top padding so fixed navbar doesn't overlap logo */}
      <section className="bg-blue-900 pt-24 pb-8 md:pt-24 md:pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <Image
            src="/dealsmedi.webp"
            alt="DealsMedi Logo"
            width={140}
            height={56}
            className="h-12 w-auto object-contain mx-auto"
          />
          <p className="mt-2 text-blue-200 text-sm max-w-2xl mx-auto">{t('subtitle')}</p>
          <Link
            href={WEBSITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 mt-3 rounded-lg font-semibold text-blue-900 bg-white hover:bg-blue-100 transition-colors text-sm"
          >
            {t('visitWebsite')}
            <ExternalLink size={16} strokeWidth={1.75} />
          </Link>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-blue-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-12">
            <motion.div
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
              <p className="text-slate-700 text-base leading-relaxed mb-6">{t('p2')}</p>
              <Link
                href={WEBSITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-white bg-blue-800 hover:bg-blue-900 transition-colors text-sm"
              >
                {t('visitWebsite')}
                <ExternalLink size={16} strokeWidth={1.75} />
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative rounded-xl overflow-hidden border border-blue-200 aspect-[4/3]"
            >
              <Image
                src="/medical.webp"
                alt="Medical and health products" 
                fill
                className="object-cover"
              />
            </motion.div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="bg-white p-5 rounded-xl border border-blue-200 hover:border-blue-600 hover:shadow-md transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-900 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{t(`features.${feature.key}.title`)}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{t(`features.${feature.key}.description`)}</p>
              </motion.div>
            ))}
          </div>

          {/* Social links – bottom of page */}
          <div className="mt-16 pt-10 border-t border-blue-200 flex flex-wrap items-center justify-center gap-4">
            <span className="text-slate-600 text-sm font-medium">{t('followUs')}</span>
            <a
              href={DEALSMEDI_SOCIAL.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-11 h-11 rounded-xl bg-white border border-blue-200 hover:border-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
              aria-label="DealsMedi on Facebook"
            >
              <Facebook size={24} strokeWidth={1.75} className="text-[#1877F2]" />
            </a>
            <a
              href={DEALSMEDI_SOCIAL.x}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-11 h-11 rounded-xl bg-white border border-blue-200 hover:border-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
              aria-label="DealsMedi on X"
            >
              <Twitter size={24} strokeWidth={1.75} className="text-[#000000]" />
            </a>
            <a
              href={DEALSMEDI_SOCIAL.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-11 h-11 rounded-xl bg-white border border-blue-200 hover:border-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
              aria-label="DealsMedi on Instagram"
            >
              <Instagram size={24} strokeWidth={1.75} className="text-[#E4405F]" />
            </a>
            <a
              href={DEALSMEDI_SOCIAL.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-11 h-11 rounded-xl bg-white border border-blue-200 hover:border-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
              aria-label="DealsMedi on YouTube"
            >
              <Youtube size={24} strokeWidth={1.75} className="text-[#FF0000]" />
            </a>
            <a
              href={DEALSMEDI_SOCIAL.pinterest}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-11 h-11 rounded-xl bg-white border border-blue-200 hover:border-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
              aria-label="DealsMedi on Pinterest"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-[#BD081C]" aria-hidden="true">
                <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.064-4.869-5.012-4.869-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.214 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
              </svg>
            </a>
          </div>
        </div>
      </section>
    </div>
    </ContentPage>
  );
}
