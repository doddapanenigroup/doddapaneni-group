"use client";

import {
  ShoppingCart,
  Cpu,
  Megaphone,
  Stethoscope,
  Building,
  Globe,
  Utensils,
  GraduationCap,
  Truck,
  Tv,
  Factory,
  Users,
  CheckCircle,
  LucideIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import ContentPage from '@/components/ContentPage';

const iconMap: Record<string, LucideIcon> = {
  "ecommerce": ShoppingCart,
  "software": Cpu,
  "digitalMarketing": Megaphone,
  "healthcare": Stethoscope,
  "media": Tv,
  "staffing": Users,
  "construction": Building,
  "importExport": Globe,
  "food": Utensils,
  "education": GraduationCap,
  "logistics": Truck,
  "manufacturing": Factory
};

export default function Services() {
  const locale = useLocale();
  const t = useTranslations('ServicesPage');
  const tServices = useTranslations('Home.servicesList');

  const serviceKeys = [
    "software",
    "digitalMarketing",
    "ecommerce",
    "media",
    "staffing",
    "healthcare",
    "construction",
    "education",
    "food",
    "manufacturing",
    "logistics",
    "importExport"
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <ContentPage pageKey="services" locale={locale}>
    <div className="min-h-screen bg-white">
      {/* Page heading – small blue strip */}
      <section className="bg-blue-900 py-6 md:py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{t('title')}</h1>
          <p className="mt-2 text-blue-200 text-sm md:text-base max-w-2xl mx-auto">{t('description')}</p>
        </div>
      </section>

      {/* Services List */}
      <section className="py-8 md:py-16 px-4 sm:px-6 lg:px-8 bg-blue-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-2 gap-3 sm:gap-4"
          >
            {serviceKeys.map((key) => {
              const IconComponent = iconMap[key] || CheckCircle;
              return (
                <motion.div
                  key={key}
                  variants={itemVariants}
                  className="bg-white p-4 sm:p-5 rounded-xl border border-blue-200 flex flex-col sm:flex-row gap-3 sm:gap-4 hover:border-blue-600 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-800">
                    <IconComponent className="w-[22px] h-[22px] sm:w-6 sm:h-6" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
                      {tServices(`${key}.title`)}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {tServices(`${key}.description`)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>
    </div>
    </ContentPage>
  );
}
