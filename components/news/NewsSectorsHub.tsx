'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { m } from 'framer-motion';
import MotionLazy from '@/components/motion/MotionLazy';
import { useMessages, useTranslations } from '@/lib/dictionary-react';
import type { CompanyDivisionSlug } from '@/lib/company-divisions';
import { newsSectorListPath } from '@/lib/news-paths';
import {
  NEWS_SECTOR_LIVE_FIRST_POLL_MS,
  NEWS_SECTOR_LIVE_POLL_MS,
  sectorLiveMapFromApiPayload,
} from '@/lib/sector-live-shared';

type SectorTile = { slug: CompanyDivisionSlug; label: string; isLive: boolean };

type Props = { locale: string; sectors: SectorTile[] };

/** Fallback if `Blog.newsHubComingSoon` is absent from the client bundle (e.g. stale dev cache). */
const NEWS_HUB_COMING_SOON_FALLBACK_EN =
  "This division's news hub will be available when the division is live on the main site.";

export default function NewsSectorsHub({ locale, sectors }: Props) {
  const t = useTranslations('Blog');
  const tNav = useTranslations('Navbar');
  const messages = useMessages();
  const blogMsg = messages.Blog as Record<string, unknown> | undefined;
  const rawComingSoon = blogMsg?.newsHubComingSoon;
  const newsHubComingSoonText =
    typeof rawComingSoon === 'string' ? rawComingSoon : NEWS_HUB_COMING_SOON_FALLBACK_EN;
  const [liveBySlug, setLiveBySlug] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sectors.map((s) => [s.slug, s.isLive])),
  );

  useEffect(() => {
    setLiveBySlug((prev) => {
      const next = { ...prev };
      for (const s of sectors) next[s.slug] = s.isLive;
      return next;
    });
  }, [sectors]);

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
    <MotionLazy>
      <section className="border-t border-blue-100 bg-white px-4 py-14 sm:px-6 md:py-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sectors.map((s, index) => {
              const isLive = liveBySlug[s.slug] ?? s.isLive;
              return (
              <m.li
                key={s.slug}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.2) }}
              >
                <article
                  className={`flex h-full flex-col rounded-2xl border-2 p-6 shadow-[0_2px_12px_rgba(30,58,138,0.06)] transition ${
                    isLive
                      ? 'border-blue-100 bg-white hover:border-blue-900 hover:shadow-[0_8px_28px_rgba(30,58,138,0.12)]'
                      : 'border-blue-100/80 bg-slate-50/80'
                  }`}
                  aria-label={
                    isLive
                      ? undefined
                      : `${s.label}. ${tNav('comingSoonNav')}`
                  }
                >
                  <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-2">
                    <h2 className="min-w-0 flex-1 text-lg font-bold leading-snug text-blue-950">{s.label}</h2>
                    {!isLive ? (
                      <span className="shrink-0 whitespace-nowrap rounded-md bg-slate-200/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                        {tNav('comingSoonNav')}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4 flex-1 text-sm leading-relaxed">
                    {isLive ? (
                      <Link
                        href={newsSectorListPath(s.slug)}
                        locale={locale}
                        className="inline-flex items-center font-bold text-blue-900 underline decoration-2 underline-offset-4 transition hover:text-blue-950"
                      >
                        {t('newsHubCta')}
                      </Link>
                    ) : (
                      <p className="text-blue-900/55">{newsHubComingSoonText}</p>
                    )}
                  </div>
                </article>
              </m.li>
            );
            })}
          </ul>
        </div>
      </section>
    </MotionLazy>
  );
}
