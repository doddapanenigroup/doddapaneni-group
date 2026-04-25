"use client";

import { useTranslations, useAppLocale as useLocale } from '@/lib/dictionary-react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { m } from 'framer-motion';
import MotionLazy from '@/components/motion/MotionLazy';

export default function FaqPageClient() {
  const locale = useLocale();
  const t = useTranslations('FAQ');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const questions = [
    { q: 'q1', key: 'q1' },
    { q: 'q2', key: 'q2' },
    { q: 'q3', key: 'q3' },
    { q: 'q4', key: 'q4' },
    { q: 'q5', key: 'q5' },
    { q: 'q6', key: 'q6' },
  ];

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
      <MotionLazy>
        <div className="min-h-screen bg-white">
          {/* Page heading */}
          <section className="bg-blue-900 px-4 py-6 sm:px-6 md:py-8 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <div className="mb-3 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                  <HelpCircle className="text-white" size={26} />
                </div>
              </div>
              <h1 className="text-xl font-bold text-white md:text-2xl">{t('title')}</h1>
              <p className="mt-1.5 text-sm text-blue-200 md:text-base">{t('subtitle')}</p>
            </div>
          </section>

          {/* FAQ Content */}
          <section
            className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-slate-50"
            aria-labelledby="faq-section-heading"
          >
            <div className="max-w-4xl mx-auto">
              <h2 id="faq-section-heading" className="mb-6 text-xl font-bold text-slate-900 md:text-2xl">
                {t('sectionHeading')}
              </h2>
              <div className="space-y-4">
                {questions.map((item, index) => (
                  <m.div
                    key={item.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => toggleQuestion(index)}
                      className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-blue-50 transition-colors"
                    >
                      <span className="text-lg font-semibold text-slate-900 pr-4">
                        {t(`questions.${item.q}.question`)}
                      </span>
                      {openIndex === index ? (
                        <ChevronUp className="text-blue-600 flex-shrink-0" size={20} />
                      ) : (
                        <ChevronDown className="text-blue-600 flex-shrink-0" size={20} />
                      )}
                    </button>
                    <div
                      className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
                        openIndex === index ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                      }`}
                    >
                      <div className="min-h-0 overflow-hidden">
                        <div className="px-6 pb-4 border-t border-transparent">
                          <p className="text-slate-700 leading-relaxed pt-3 text-[15px] sm:text-base">
                            {t(`questions.${item.q}.answer`)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </m.div>
                ))}
              </div>

              {/* Contact Support Section */}
              <div className="mt-12 bg-blue-900 rounded-xl p-6 md:p-8 text-center text-white">
                <h2 className="text-xl font-bold mb-2">{t('contactSupport')}</h2>
                <p className="text-blue-200 mb-6">{t('contactSupportDesc')}</p>
                <Link
                  href="/contact"
                  className="inline-block px-6 py-3 bg-white text-blue-900 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
                >
                  {t('contactButton')}
                </Link>
              </div>
            </div>
          </section>
        </div>
      </MotionLazy>
  );
}
