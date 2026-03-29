'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Search, FileText, BookOpen, User, Loader2, X } from 'lucide-react';
import { routing } from '@/i18n/routing';
import { useDashboardShortcuts } from '@/components/dashboard/DashboardShortcutsProvider';
import {
  defaultDashboardKeyboardShortcuts,
  getDashboardKeyboardConfig,
} from '@/lib/keyboard-shortcuts-config';
import { shortcutParts } from '@/lib/keyboard-shortcuts';

type UserHit = { id: string; email: string; name: string | null; username: string | null; role: string };
type PageHit = { id: string; title: string; slug: string; locale: string; status: string };
type BlogHit = { id: string; title: string; slug: string; status: string };

type FlatItem = {
  kind: 'user' | 'page' | 'blog';
  key: string;
  title: string;
  subtitle: string;
  href: string;
};

function pagePublicPath(locale: string, slug: string): string {
  if (locale === routing.defaultLocale) return `/${slug}`;
  return `/${locale}/${slug}`;
}

function blogPublicPath(locale: string, slug: string): string {
  if (locale === routing.defaultLocale) return `/news/${slug}`;
  return `/${locale}/news/${slug}`;
}

function buildFlatItems(
  dashboardLocale: string,
  data: { users: UserHit[]; pages: PageHit[]; blogs: BlogHit[] }
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
  for (const b of data.blogs) {
    items.push({
      kind: 'blog',
      key: `b:${b.id}`,
      title: b.title,
      subtitle: `${b.slug} · ${b.status}`,
      href: blogPublicPath(dashboardLocale, b.slug),
    });
  }
  return items;
}

const kbdHintClass =
  'rounded border border-slate-200 bg-slate-50 px-1 dark:border-slate-700 dark:bg-slate-800';

function SearchShortcutHints() {
  const [parts, setParts] = useState(() =>
    shortcutParts(defaultDashboardKeyboardShortcuts.search.binding)
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

export default function GlobalSearchPalette({ locale }: { locale: string }) {
  const router = useRouter();
  const { registerSearchToggle, pushEscLayer } = useDashboardShortcuts();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<FlatItem[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const debouncedQuery = useDebouncedValue(query, 280);

  const load = useCallback(
    async (q: string) => {
      abortRef.current?.abort();
      if (q.length < 2) {
        setItems([]);
        setLoading(false);
        return;
      }
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/dashboard/search?q=${encodeURIComponent(q)}&limit=8`,
          { signal: ac.signal, cache: 'no-store' }
        );
        if (!res.ok) throw new Error('search failed');
        const json = (await res.json()) as {
          users: UserHit[];
          pages: PageHit[];
          blogs: BlogHit[];
        };
        if (!ac.signal.aborted) {
          setItems(buildFlatItems(locale, json));
          setActive(0);
        }
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
        if (!ac.signal.aborted) setItems([]);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    },
    [locale]
  );

  useEffect(() => {
    if (!open) return;
    void load(debouncedQuery);
  }, [open, debouncedQuery, load]);

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
      router.push(href);
    },
    [router]
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
              placeholder="Search users, pages, blogs…"
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

          <div className="max-h-[min(60vh,420px)] overflow-y-auto">
            {query.length > 0 && query.length < 2 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                Type at least 2 characters
              </p>
            ) : items.length === 0 && !loading && debouncedQuery.length >= 2 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                No matches
              </p>
            ) : items.length === 0 && !loading ? (
              <p className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                Start typing to search
              </p>
            ) : (
              <ul className="py-2">
                {items.map((it, i) => {
                  const Icon = it.kind === 'user' ? User : it.kind === 'page' ? FileText : BookOpen;
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
          document.body
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 max-w-[180px] items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 px-2.5 text-left text-sm text-slate-500 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400 dark:hover:bg-slate-800 sm:max-w-[220px] sm:px-3 lg:max-w-[260px]"
        aria-label="Open search"
      >
        <Search className="h-4 w-4 shrink-0 opacity-70" />
        <span className="min-w-0 flex-1 truncate hidden sm:inline">Search…</span>
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
