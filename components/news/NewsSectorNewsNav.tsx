'use client';

import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import {
  COMPANY_DIVISION_SLUGS,
  COMPANY_DIVISION_NAV_LABELS,
  type CompanyDivisionSlug,
} from '@/lib/company-divisions';
import { newsSectorListPath } from '@/lib/news-paths';

type Props = {
  locale: string;
  currentSlug: string;
};

export default function NewsSectorNewsNav({ locale, currentSlug }: Props) {
  const t = useTranslations('Blog');
  const normalized = currentSlug.trim().toLowerCase();

  return (
    <nav
      aria-label={t('sectorNewsNavAriaLabel')}
      className="rounded-2xl border-2 border-blue-100 bg-white p-4 shadow-[0_2px_12px_rgba(30,58,138,0.06)]"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-900">
        {t('sectorNewsNavHeading')}
      </p>
      <Link
        href="/news"
        locale={locale}
        className="mt-3 block rounded-xl border-2 border-blue-200 bg-white px-3 py-2.5 text-sm font-bold text-blue-900 transition hover:border-blue-900 hover:bg-blue-50"
      >
        {t('browseAllNews')}
      </Link>
      <ul className="mt-4 max-h-[min(60vh,28rem)] space-y-1 overflow-y-auto pr-1 lg:max-h-[calc(100vh-8rem)]">
        {COMPANY_DIVISION_SLUGS.map((slug) => {
          const active = slug === normalized;
          const label = COMPANY_DIVISION_NAV_LABELS[slug as CompanyDivisionSlug];
          return (
            <li key={slug}>
              <Link
                href={newsSectorListPath(slug)}
                locale={locale}
                className={
                  active
                    ? 'block rounded-xl bg-blue-900 px-3 py-2.5 text-sm font-bold leading-snug text-white'
                    : 'block rounded-xl border-2 border-transparent px-3 py-2.5 text-sm font-semibold leading-snug text-blue-900 transition hover:border-blue-200 hover:bg-blue-50'
                }
                aria-current={active ? 'page' : undefined}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
