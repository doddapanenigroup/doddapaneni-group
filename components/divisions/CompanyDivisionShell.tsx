'use client';

import { Link, usePathname, routing } from '@/i18n/routing';
import type { DivisionSubpage } from '@/lib/company-division-subpages';
import { getDivisionSubpageLabel } from '@/lib/company-division-subpages';
import type { DivisionTopicNavItem } from '@/lib/company-division-nav';
import CompanyDivisionTopicNav from '@/components/divisions/CompanyDivisionTopicNav';

const SUBPAGES: DivisionSubpage[] = ['about', 'services', 'contact'];

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
  const pathname = usePathname();
  const { slug } = sector;
  const base = `/${slug}`;

  const segments = stripLocalePrefix(pathname.split('/').filter(Boolean));
  const isOverview = segments.length === 1 && segments[0] === slug;

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-800">Division</p>
            <p className="text-lg font-bold text-slate-900 sm:text-xl">{sector.name}</p>
          </div>
          <nav
            aria-label="Division sections"
            className="flex flex-wrap gap-2 border-t border-slate-200/80 pt-3 sm:gap-3"
          >
            <Link
              href={base}
              className={
                isOverview
                  ? 'rounded-lg bg-blue-900 px-3 py-2 text-sm font-medium text-white'
                  : 'rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'
              }
            >
              Overview
            </Link>
            {SUBPAGES.map((sub) => {
              const href = `${base}/${sub}`;
              const active = segments.length === 2 && segments[0] === slug && segments[1] === sub;
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
                  {getDivisionSubpageLabel(sub)}
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
