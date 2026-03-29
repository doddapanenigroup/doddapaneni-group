'use client';

import { Link } from '@/i18n/routing';
import { m } from 'framer-motion';
import MotionLazy from '@/components/motion/MotionLazy';
import { useTranslations } from 'next-intl';
import type { CompanyDivisionSlug } from '@/lib/company-divisions';
import { newsSectorListPath } from '@/lib/news-paths';

type SectorTile = { slug: CompanyDivisionSlug; label: string };

type Props = { locale: string; sectors: SectorTile[] };

export default function NewsSectorsHub({ locale, sectors }: Props) {
  const t = useTranslations('Blog');

  return (
    <MotionLazy>
      <section className="border-t border-slate-100 bg-slate-50 px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sectors.map((s, index) => (
              <m.li
                key={s.slug}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.2) }}
              >
                <article className="flex h-full flex-col rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-md">
                  <h2 className="text-lg font-bold leading-snug text-slate-900">{s.label}</h2>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">
                    <Link
                      href={newsSectorListPath(s.slug)}
                      locale={locale}
                      className="font-semibold text-blue-700 underline-offset-2 hover:text-blue-900 hover:underline"
                    >
                      {t('newsHubCta')}
                    </Link>
                  </p>
                </article>
              </m.li>
            ))}
          </ul>
        </div>
      </section>
    </MotionLazy>
  );
}
