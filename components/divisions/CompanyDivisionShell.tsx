'use client';

import { routing } from '@/i18n/routing';
import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from '@/lib/dictionary-react';
import type { DivisionSubpage } from '@/lib/company-division-subpages';
import { divisionSubpagePublicPath } from '@/lib/company-division-subpages';
import type { DivisionTopicNavItem } from '@/lib/company-division-nav-i18n';
import CompanyDivisionTopicNav from '@/components/divisions/CompanyDivisionTopicNav';

const SUBPAGES: DivisionSubpage[] = ['about', 'services', 'companies', 'contact'];

function stripLocalePrefix(segments: string[]): string[] {
  if (segments.length === 0) return segments;
  const first = segments[0];
  if (routing.locales.includes(first as (typeof routing.locales)[number])) {
    return segments.slice(1);
  }
  return segments;
}

export default function CompanyDivisionShell({
  sector,
  topicNavItems = [],
  children,
}: {
  sector: { name: string; slug: string };
  topicNavItems?: DivisionTopicNavItem[];
  children: React.ReactNode;
}) {
  const t = useTranslations('Blog');
  const pathname = usePathname();
  const { slug } = sector;
  const base = `/${slug}`;

  const segments = stripLocalePrefix(pathname.split('/').filter(Boolean));
  const isOverview = segments.length === 1 && segments[0] === slug;

  const subpageLabel = (sub: DivisionSubpage): string => {
    switch (sub) {
      case 'about':
        return t('divisionSubpageAbout');
      case 'services':
        return t('divisionSubpageServices');
      case 'companies':
        return t('divisionSubpageCompanies');
      case 'contact':
        return t('divisionSubpageContact');
      default:
        return sub;
    }
  };

  return (
    <div className="min-h-screen bg-white pt-20">
      <div className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-2.5 sm:px-6 sm:py-3.5 lg:px-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-800 sm:text-xs">
              {t('divisionShellEyebrow')}
            </p>
            <p className="text-base font-bold text-slate-900 sm:text-lg">{sector.name}</p>
          </div>
          <nav
            aria-label={t('divisionNavAriaLabel')}
            className="flex flex-wrap gap-1.5 border-t border-slate-200/80 pt-2 sm:gap-2"
          >
            <Link
              href={base}
              className={
                isOverview
                  ? 'rounded-lg bg-blue-900 px-3 py-2 text-sm font-medium text-white'
                  : 'rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'
              }
            >
              {t('divisionOverview')}
            </Link>
            {SUBPAGES.map((sub) => {
              const href = divisionSubpagePublicPath(slug, sub);
              const active =
                (segments.length === 2 && segments[0] === slug && segments[1] === sub) ||
                (sub === 'services' && segments.length === 1 && segments[0] === `${slug}-services`);
              return (
                <Link
                  key={sub}
                  href={href}
                  className={
                    active
                      ? 'rounded-lg bg-blue-900 px-3 py-2 text-sm font-medium text-white'
                      : 'rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'
                  }
                >
                  {subpageLabel(sub)}
                </Link>
              );
            })}
          </nav>
          {topicNavItems.length > 0 ? (
            <div className="border-t border-slate-200/80 pt-3">
              <CompanyDivisionTopicNav items={topicNavItems} />
            </div>
          ) : null}
        </div>
      </div>
      {children}
    </div>
  );
}
