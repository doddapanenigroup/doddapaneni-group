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
      <section className="border-t border-blue-100 bg-white px-4 py-14 sm:px-6 md:py-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sectors.map((s, index) => (
              <m.li
                key={s.slug}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.2) }}
              >
                <article className="flex h-full flex-col rounded-2xl border-2 border-blue-100 bg-white p-6 shadow-[0_2px_12px_rgba(30,58,138,0.06)] transition hover:border-blue-900 hover:shadow-[0_8px_28px_rgba(30,58,138,0.12)]">
                  <h2 className="text-lg font-bold leading-snug text-blue-950">{s.label}</h2>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-blue-900/80">
                    <Link
                      href={newsSectorListPath(s.slug)}
                      locale={locale}
                      className="inline-flex items-center font-bold text-blue-900 underline decoration-2 underline-offset-4 transition hover:text-blue-950"
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
