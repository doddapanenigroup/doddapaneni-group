'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from '@/lib/dictionary-react';
import {
  COMPANY_DIVISION_SLUGS,
  COMPANY_DIVISION_NAV_LABELS,
  type CompanyDivisionSlug,
} from '@/lib/company-divisions';
import { newsSectorListPath } from '@/lib/news-paths';
import { NEWS_PUBLIC_LINK_LOCALE } from '@/lib/news-ui-locale';
import {
  EMPTY_SECTOR_LIVE_MAP,
  NEWS_SECTOR_LIVE_FIRST_POLL_MS,
  NEWS_SECTOR_LIVE_POLL_MS,
  sectorLiveMapFromApiPayload,
} from '@/lib/sector-live-shared';

type Props = {
  locale: string;
  currentSlug: string;
  /** Server snapshot; polling refreshes when admins toggle `isLive`. */
  initialSectorLiveMap?: Record<string, boolean>;
};

export default function NewsSectorNewsNav({ locale: _pageLocale, currentSlug, initialSectorLiveMap }: Props) {
  const t = useTranslations('Blog');
  const tNav = useTranslations('Navbar');
  const normalized = currentSlug.trim().toLowerCase();
  const [liveBySlug, setLiveBySlug] = useState<Record<string, boolean>>(() => ({
    ...EMPTY_SECTOR_LIVE_MAP,
    ...initialSectorLiveMap,
  }));

  useEffect(() => {
    if (initialSectorLiveMap) {
      setLiveBySlug((prev) => ({ ...prev, ...initialSectorLiveMap }));
    }
  }, [initialSectorLiveMap]);

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | number | undefined;
    const load = async () => {
      try {
        const r = await fetch('/api/public/sectors');
        if (!r.ok || cancelled) return;
        const d = (await r.json()) as { sectors?: unknown };
        setLiveBySlug(sectorLiveMapFromApiPayload(d));
      } catch {
        /* keep last map */
      }
    };
    const firstTimer = window.setTimeout(() => {
      if (cancelled) return;
      void load();
      intervalId = window.setInterval(() => void load(), NEWS_SECTOR_LIVE_POLL_MS);
    }, NEWS_SECTOR_LIVE_FIRST_POLL_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(firstTimer);
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, []);

  return (
    <nav
      aria-label={t('sectorNewsNavAriaLabel')}
      className="w-full max-w-full rounded-2xl border-2 border-blue-100 bg-white p-4 shadow-[0_2px_12px_rgba(30,58,138,0.06)]"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-900">
        {t('sectorNewsNavHeading')}
      </p>
      <Link
        href="/news"
        locale={NEWS_PUBLIC_LINK_LOCALE}
        className="mt-3 block rounded-xl border-2 border-blue-200 bg-white px-3 py-2.5 text-sm font-bold text-blue-900 transition hover:border-blue-900 hover:bg-blue-50"
      >
        {t('browseAllNews')}
      </Link>
      <ul className="mt-4 max-h-[min(60vh,28rem)] space-y-1 overflow-y-auto pr-1 lg:max-h-[calc(100vh-8rem)]">
        {COMPANY_DIVISION_SLUGS.map((slug) => {
          const active = slug === normalized;
          const label = COMPANY_DIVISION_NAV_LABELS[slug as CompanyDivisionSlug];
          const isLive = liveBySlug[slug] ?? false;
          const inactiveLink =
            'block rounded-xl border-2 border-transparent px-3 py-2.5 text-sm font-semibold leading-snug text-blue-900 transition hover:border-blue-200 hover:bg-blue-50';
          const inactiveSoon =
            'block rounded-xl border-2 border-dashed border-blue-200/80 bg-slate-50/90 px-3 py-2.5 text-sm font-semibold leading-snug text-blue-900/60';
          const activeLive = 'block rounded-xl bg-blue-900 px-3 py-2.5 text-sm font-bold leading-snug text-white';
          const activeSoon =
            'block rounded-xl border-2 border-blue-300 bg-slate-100 px-3 py-2.5 text-sm font-bold leading-snug text-blue-950';

          if (isLive) {
            return (
              <li key={slug}>
                <Link
                  href={newsSectorListPath(slug)}
                  locale={NEWS_PUBLIC_LINK_LOCALE}
                  className={active ? activeLive : inactiveLink}
                  aria-current={active ? 'page' : undefined}
                >
                  {label}
                </Link>
              </li>
            );
          }

          return (
            <li key={slug}>
              <span
                className={active ? activeSoon : inactiveSoon}
                aria-current={active ? 'page' : undefined}
              >
                <span className="block">{label}</span>
                <span className="mt-1 block text-[11px] font-bold uppercase tracking-wide text-blue-900/50">
                  {tNav('comingSoonNav')}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
