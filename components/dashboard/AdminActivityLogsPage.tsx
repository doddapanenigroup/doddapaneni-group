'use client';

import { useCallback, useEffect, useState } from 'react';
import { Megaphone, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  dashboardHeaderActionSecondary,
  dashboardMainMaxClass,
  dashboardPanelClass,
  dashboardPanelHeaderClass,
  dashboardStageClass,
  dashboardToolbarStripClass,
} from '@/lib/dashboard-ui';
import { publicPathForLocale } from '@/lib/public-path-with-locale';

const PAGE_SIZE = 50;

type ContentEditItem = {
  id: string;
  createdAt: string;
  userEmail: string;
  userRole: string;
  kind: string;
  targetPath: string;
  summary: string | null;
};

type MarketingItem = {
  id: string;
  createdAt: string;
  userEmail: string;
  userRole: string;
  entity: string;
  action: string;
  seoNote: string | null;
};

type ListState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready';
      items: ContentEditItem[] | MarketingItem[];
      total: number;
      page: number;
      totalPages: number;
    };

export default function AdminActivityLogsPage({
  locale,
  kind,
}: {
  locale: string;
  kind: 'content-edits' | 'marketing';
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const adminHome = publicPathForLocale(locale, '/dashboard/admin');

  const pageFromUrl = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1);

  const [state, setState] = useState<ListState>({ status: 'loading' });

  const title =
    kind === 'content-edits'
      ? 'Developer edits (files & CMS)'
      : 'Digital marketer / SEO-related changes';

  const load = useCallback(
    async (page: number) => {
      setState({ status: 'loading' });
      try {
        const res = await fetch(
          `/api/dashboard/admin-activity-logs?kind=${kind}&page=${page}&pageSize=${PAGE_SIZE}`,
          { cache: 'no-store', credentials: 'include' },
        );
        if (!res.ok) throw new Error('Failed to load');
        const json = (await res.json()) as {
          items: ContentEditItem[] | MarketingItem[];
          total: number;
          page: number;
          totalPages: number;
        };
        setState({
          status: 'ready',
          items: json.items,
          total: json.total,
          page: json.page,
          totalPages: json.totalPages,
        });
      } catch {
        setState({ status: 'error', message: 'Could not load activity.' });
      }
    },
    [kind],
  );

  useEffect(() => {
    void load(pageFromUrl);
  }, [load, pageFromUrl]);

  function goToPage(nextPage: number) {
    if (state.status !== 'ready') return;
    const p = Math.max(1, Math.min(nextPage, state.totalPages));
    const qs = new URLSearchParams(searchParams.toString());
    if (p <= 1) qs.delete('page');
    else qs.set('page', String(p));
    const q = qs.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }

  const isMarketing = kind === 'marketing';
  const ready = state.status === 'ready';
  const items = ready ? state.items : [];
  const totalPages = ready ? state.totalPages : 1;
  const page = ready ? state.page : 1;
  const total = ready ? state.total : 0;

  return (
    <div className={`${dashboardMainMaxClass} flex min-h-[calc(100dvh-9rem)] flex-col gap-6`}>
      <div className={`${dashboardToolbarStripClass} shrink-0 justify-end xl:sticky xl:top-[4.5rem] xl:z-10`}>
        <Link href={adminHome} className={dashboardHeaderActionSecondary}>
          Admin home
        </Link>
      </div>

      <div className={`${dashboardStageClass} flex min-h-0 flex-1 flex-col`}>
        <section className={`flex min-h-0 flex-1 flex-col ${dashboardPanelClass}`}>
          <h2
            className={`flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100 ${dashboardPanelHeaderClass}`}
          >
            {isMarketing ? <Megaphone size={20} className="shrink-0 text-slate-600" /> : null}
            {title}
          </h2>

          {state.status === 'loading' ? (
            <p className="p-5 text-sm text-slate-500">Loading…</p>
          ) : state.status === 'error' ? (
            <p className="p-5 text-sm text-red-600">{state.message}</p>
          ) : (
            <>
              <ul className="flex min-h-0 flex-1 flex-col divide-y divide-slate-100 dark:divide-slate-800">
                {items.length === 0 ? (
                  <li className="flex flex-1 flex-col justify-center p-6 text-sm text-slate-500">No entries yet.</li>
                ) : kind === 'content-edits' ? (
                  (items as ContentEditItem[]).map((c) => (
                    <li key={c.id} className="px-4 py-3 text-sm sm:px-5 sm:py-3.5">
                      <p className="text-slate-900 dark:text-slate-100">
                        <span className="font-mono text-xs text-slate-600">{c.kind}</span>{' '}
                        <span className="font-medium">{c.targetPath}</span>
                        <span className="text-slate-500"> · {c.userEmail}</span>
                      </p>
                      <p className="text-xs text-slate-500">{new Date(c.createdAt).toLocaleString()}</p>
                      {c.summary ? <p className="mt-1 text-xs text-slate-600">{c.summary}</p> : null}
                    </li>
                  ))
                ) : (
                  (items as MarketingItem[]).map((m) => (
                    <li key={m.id} className="px-4 py-3 text-sm sm:px-5 sm:py-3.5">
                      <p className="text-slate-900 dark:text-slate-100">
                        <span className="font-medium capitalize">{m.action}</span>{' '}
                        <span className="text-slate-600">{m.entity}</span>
                        <span className="text-slate-500"> · {m.userEmail}</span>
                      </p>
                      <p className="text-xs text-slate-500">{new Date(m.createdAt).toLocaleString()}</p>
                      {m.seoNote ? (
                        <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">SEO note: {m.seoNote}</p>
                      ) : null}
                    </li>
                  ))
                )}
              </ul>

              <nav
                className="mt-auto flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-4 dark:border-slate-700 sm:px-5"
                aria-label="Pagination"
              >
                <p className="text-xs text-slate-500">
                  {total === 0 ? (
                    'No records'
                  ) : (
                    <>
                      Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
                    </>
                  )}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => goToPage(page - 1)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <ChevronLeft size={16} aria-hidden />
                    Previous
                  </button>
                  <span className="text-xs tabular-nums text-slate-600 dark:text-slate-400">
                    Page {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => goToPage(page + 1)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Next
                    <ChevronRight size={16} aria-hidden />
                  </button>
                </div>
              </nav>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
