'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  Search,
  FileText,
  BookOpen,
  User,
  Loader2,
  X,
  LayoutDashboard,
  Building2,
  Briefcase,
} from 'lucide-react';
import type { Role } from '@/lib/constants';
import { useDashboardShortcuts } from '@/components/dashboard/DashboardShortcutsProvider';
import {
  defaultDashboardKeyboardShortcuts,
  getDashboardKeyboardConfig,
} from '@/lib/keyboard-shortcuts-config';
import { shortcutParts } from '@/lib/keyboard-shortcuts';
import { publicPathWithLocale } from '@/lib/public-path-with-locale';
import {
  dashboardNavSearchHits,
  filterDashboardNavSearchHits,
  type DashboardNavSearchHit,
} from '@/lib/dashboard-search-nav';

type UserHit = { id: string; email: string; name: string | null; username: string | null; role: string };
type PageHit = { id: string; title: string; slug: string; locale: string; status: string };
type NewsHit = { id: string; title: string; slug: string; status: string; sectorSlug?: string | null };
type SectorHit = { id: string; name: string; slug: string };
type CompanyHit = { id: string; name: string; slug: string; sectorSlug?: string | null };

type FlatItem = {
  kind: 'user' | 'page' | 'news' | 'nav' | 'sector' | 'company';
  key: string;
  title: string;
  subtitle: string;
  href: string;
};

function pagePublicPath(pageLocale: string, slug: string): string {
  const parts = slug.split('/').filter(Boolean);
  if (parts.length === 0) return publicPathWithLocale(pageLocale);
  return publicPathWithLocale(pageLocale, ...parts);
}

function newsPublicPath(dashboardLocale: string, slug: string, sectorSlug: string | null | undefined) {
  if (sectorSlug) return publicPathWithLocale(dashboardLocale, 'news', sectorSlug, slug);
  return publicPathWithLocale(dashboardLocale, 'news', slug);
}

function sectorPublicPath(dashboardLocale: string, slug: string) {
  return publicPathWithLocale(dashboardLocale, slug);
}

function companyPublicPath(dashboardLocale: string, slug: string) {
  return publicPathWithLocale(dashboardLocale, 'companies', slug);
}

function dedupeByHref(items: FlatItem[]): FlatItem[] {
  const seen = new Set<string>();
  const out: FlatItem[] = [];
  for (const it of items) {
    if (seen.has(it.href)) continue;
    seen.add(it.href);
    out.push(it);
  }
  return out;
}

function mapNavToFlat(hits: DashboardNavSearchHit[]): FlatItem[] {
  return hits.map((h) => ({
    kind: 'nav' as const,
    key: h.id,
    title: h.title,
    subtitle: h.subtitle,
    href: h.href,
  }));
}

function buildFlatItems(
  dashboardLocale: string,
  data: {
    users: UserHit[];
    pages: PageHit[];
    news: NewsHit[];
    sectors?: SectorHit[];
    companies?: CompanyHit[];
  },
): FlatItem[] {
  const items: FlatItem[] = [];
  for (const u of data.users) {
    items.push({
      kind: 'user',
      key: `u:${u.id}`,
      title: u.name?.trim() || u.email,
      subtitle: `${u.email} · ${u.role}`,
      href: `/${dashboardLocale}/dashboard/employees`,
    });
  }
  for (const p of data.pages) {
    items.push({
      kind: 'page',
      key: `p:${p.id}`,
      title: p.title,
      subtitle: `${p.slug} · ${p.locale} · ${p.status}`,
      href: pagePublicPath(p.locale, p.slug),
    });
  }
  for (const b of data.news) {
    items.push({
      kind: 'news',
      key: `n:${b.id}`,
      title: b.title,
      subtitle: `${b.slug} · ${b.status}${b.sectorSlug ? ` · ${b.sectorSlug}` : ''}`,
      href: newsPublicPath(dashboardLocale, b.slug, b.sectorSlug),
    });
  }
  for (const s of data.sectors ?? []) {
    items.push({
      kind: 'sector',
      key: `s:${s.id}`,
      title: s.name,
      subtitle: `Division · ${s.slug}`,
      href: sectorPublicPath(dashboardLocale, s.slug),
    });
  }
  for (const c of data.companies ?? []) {
    items.push({
      kind: 'company',
      key: `c:${c.id}`,
      title: c.name,
      subtitle: `${c.slug}${c.sectorSlug ? ` · ${c.sectorSlug}` : ''}`,
      href: companyPublicPath(dashboardLocale, c.slug),
    });
  }
  return items;
}

function hitIcon(kind: FlatItem['kind']) {
  switch (kind) {
    case 'user':
      return User;
    case 'page':
      return FileText;
    case 'news':
      return BookOpen;
    case 'nav':
      return LayoutDashboard;
    case 'sector':
      return Building2;
    case 'company':
      return Briefcase;
    default:
      return Search;
  }
}

const kbdHintClass =
  'rounded border border-slate-200 bg-slate-50 px-1 dark:border-slate-700 dark:bg-slate-800';

function SearchShortcutHints() {
  const [parts, setParts] = useState(() =>
    shortcutParts(defaultDashboardKeyboardShortcuts.search.binding),
  );
  useLayoutEffect(() => {
    setParts(shortcutParts(getDashboardKeyboardConfig().search.binding));
  }, []);
  return (
    <>
      {parts.modLabel ? <kbd className={kbdHintClass}>{parts.modLabel}</kbd> : null}
      {parts.shift ? <kbd className={kbdHintClass}>⇧</kbd> : null}
      <kbd className={kbdHintClass}>{parts.keyLabel}</kbd>
    </>
  );
}

export default function GlobalSearchPalette({
  locale,
  role,
  className = '',
}: {
  locale: string;
  role: Role;
  className?: string;
}) {
  const router = useRouter();
  const { registerSearchToggle, pushEscLayer } = useDashboardShortcuts();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<FlatItem[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const debouncedQuery = useDebouncedValue(query, 280);

  const navHitsFor = useCallback(
    (q: string) =>
      mapNavToFlat(filterDashboardNavSearchHits(dashboardNavSearchHits(locale, role), q.trim(), 8)),
    [locale, role],
  );

  const runSearch = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      const navItems = navHitsFor(trimmed);

      abortRef.current?.abort();
      if (trimmed.length < 2) {
        setItems(navItems);
        setLoading(false);
        setFetchError(null);
        setActive(0);
        return;
      }

      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      setFetchError(null);
      try {
        const res = await fetch(
          `/api/dashboard/search?q=${encodeURIComponent(trimmed)}&limit=10`,
          { signal: ac.signal, cache: 'no-store', credentials: 'same-origin' },
        );
        if (res.status === 401 || res.status === 403) {
          if (!ac.signal.aborted) {
            setFetchError(res.status === 401 ? 'Session expired — refresh or sign in again.' : 'No access to search.');
            setItems(navItems);
          }
          return;
        }
        if (!res.ok) throw new Error('search failed');
        const json = (await res.json()) as {
          users: UserHit[];
          pages: PageHit[];
          news: NewsHit[];
          sectors?: SectorHit[];
          companies?: CompanyHit[];
        };
        if (!ac.signal.aborted) {
          const apiItems = buildFlatItems(locale, {
            users: json.users ?? [],
            pages: json.pages ?? [],
            news: json.news ?? [],
            sectors: json.sectors ?? [],
            companies: json.companies ?? [],
          });
          setItems(dedupeByHref([...navItems, ...apiItems]));
          setActive(0);
        }
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
        if (!ac.signal.aborted) {
          setFetchError('Search failed. Try again.');
          setItems(navItems);
        }
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    },
    [locale, navHitsFor],
  );

  useEffect(() => {
    if (!open) return;
    void runSearch(debouncedQuery);
  }, [open, debouncedQuery, runSearch]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    registerSearchToggle(() => setOpen((o) => !o));
    return () => registerSearchToggle(null);
  }, [registerSearchToggle]);

  useEffect(() => {
    if (!open) return;
    return pushEscLayer(() => setOpen(false));
  }, [open, pushEscLayer]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery('');
      setItems([]);
      setFetchError(null);
      router.push(href);
    },
    [router],
  );

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, Math.max(items.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && items[active]) {
      e.preventDefault();
      go(items[active].href);
    }
  };

  const showEmptyNoMatches =
    items.length === 0 && !loading && debouncedQuery.trim().length >= 1 && !fetchError;
  const showHintTwoChars =
    query.trim().length > 0 && query.trim().length < 2 && debouncedQuery.trim().length < 2;

  const panel =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 p-4 pt-[min(12vh,6rem)] backdrop-blur-sm sm:pt-[10vh]"
            role="presentation"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <div
              className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
              role="dialog"
              aria-modal="true"
              aria-label="Search"
            >
              <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                {loading ? (
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin text-slate-400" aria-hidden />
                ) : (
                  <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
                )}
                <input
                  ref={inputRef}
                  type="search"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="Search dashboard, users, CMS, divisions…"
                  className="min-w-0 flex-1 bg-transparent text-base text-slate-900 placeholder:text-slate-400 outline-none dark:text-slate-100"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onSearchKeyDown}
                />
                <button
                  type="button"
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {fetchError ? (
                <p className="border-b border-amber-100 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-100">
                  {fetchError}
                </p>
              ) : null}

              <div className="max-h-[min(60vh,420px)] overflow-y-auto">
                {showHintTwoChars ? (
                  <p className="px-4 py-3 text-center text-xs text-slate-500 dark:text-slate-400">
                    Matching dashboard pages below. Type <strong>2+ characters</strong> to also search users,
                    CMS pages, news articles, sectors, and companies.
                  </p>
                ) : null}
                {showEmptyNoMatches ? (
                  <p className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                    No matches
                  </p>
                ) : items.length === 0 && !loading && debouncedQuery.trim().length < 1 ? (
                  <p className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                    Start typing to search
                  </p>
                ) : (
                  <ul className="py-2">
                    {items.map((it, i) => {
                      const Icon = hitIcon(it.kind);
                      const sel = i === active;
                      return (
                        <li key={it.key}>
                          <button
                            type="button"
                            className={`flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors ${
                              sel
                                ? 'bg-slate-100 dark:bg-slate-800'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                            }`}
                            onMouseEnter={() => setActive(i)}
                            onClick={() => go(it.href)}
                          >
                            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                                {it.title}
                              </p>
                              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                {it.subtitle}
                              </p>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-4 py-2 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-500">
                <span>
                  <kbd className="rounded border border-slate-200 bg-slate-50 px-1 dark:border-slate-700 dark:bg-slate-800">
                    ↑↓
                  </kbd>{' '}
                  navigate ·{' '}
                  <kbd className="rounded border border-slate-200 bg-slate-50 px-1 dark:border-slate-700 dark:bg-slate-800">
                    ↵
                  </kbd>{' '}
                  open
                </span>
                <span className="inline-flex flex-wrap items-center gap-0.5">
                  <SearchShortcutHints />
                  <span className="ml-0.5">toggle</span>
                </span>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex h-10 w-full min-w-0 items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 px-2.5 text-left text-sm text-slate-500 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400 dark:hover:bg-slate-800 sm:px-3 ${className}`}
        aria-label="Open search"
      >
        <Search className="h-4 w-4 shrink-0 opacity-70" />
        <span className="min-w-0 flex-1 truncate text-left hidden sm:inline">Search…</span>
        <span className="ml-auto hidden shrink-0 items-center gap-0.5 sm:inline-flex">
          <SearchShortcutHints />
        </span>
      </button>
      {panel}
    </>
  );
}

function useDebouncedValue<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return v;
}
