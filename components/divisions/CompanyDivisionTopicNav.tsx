'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from '@/lib/dictionary-react';
import { routing } from '@/i18n/routing';
import { Link, usePathname } from '@/i18n/navigation';
import type { DivisionTopicNavItem } from '@/lib/company-division-nav-i18n';
import { topicAnchorIdFromHref } from '@/lib/company-division-nav';

function stripLocaleFromSegments(segments: string[]): string[] {
  if (segments.length === 0) return segments;
  const first = segments[0];
  if (routing.locales.includes(first as (typeof routing.locales)[number])) {
    return segments.slice(1);
  }
  return segments;
}

function normalizePath(path: string): string {
  if (!path || path === '/') return '';
  const trimmed = path.replace(/\/$/, '');
  return trimmed || '';
}

function pathWithoutHash(href: string): string {
  const i = href.indexOf('#');
  return normalizePath(i === -1 ? href : href.slice(0, i));
}

function hashFromHref(href: string): string | null {
  const i = href.indexOf('#');
  if (i === -1) return null;
  const h = href.slice(i);
  return h.length > 1 ? h : null;
}

export default function CompanyDivisionTopicNav({ items }: { items: DivisionTopicNavItem[] }) {
  const t = useTranslations('Blog');
  const pathname = usePathname();
  const [hash, setHash] = useState('');

  useEffect(() => {
    const read = () => setHash(typeof window !== 'undefined' ? window.location.hash : '');
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);

  const currentPath = useMemo(() => {
    const segments = stripLocaleFromSegments(pathname.split('/').filter(Boolean));
    return normalizePath(`/${segments.join('/')}`);
  }, [pathname]);

  const isActive = (item: DivisionTopicNavItem): boolean => {
    const base = pathWithoutHash(item.href);
    const h = hashFromHref(item.href);

    if (h) {
      return currentPath === base && hash === h;
    }
    return currentPath === normalizePath(base);
  };

  if (items.length === 0) return null;

  return (
    <nav aria-label={t('divisionTopicsAriaLabel')} className="min-w-0">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {t('divisionTopicNavEyebrow')}
      </p>
      <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
        {items.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={`${item.topicId}-${item.href}`}
              href={item.href}
              scroll={!!topicAnchorIdFromHref(item.href)}
              className={
                active
                  ? 'shrink-0 rounded-full bg-blue-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm sm:text-sm'
                  : 'shrink-0 rounded-full bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-100 hover:ring-slate-300 sm:text-sm'
              }
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
