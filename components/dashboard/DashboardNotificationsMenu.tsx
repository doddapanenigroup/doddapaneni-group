'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, Loader2 } from 'lucide-react';
import type { Role } from '@/lib/constants';
import { useDashboardShortcuts } from '@/components/dashboard/DashboardShortcutsProvider';
import { publicPathForLocale } from '@/lib/public-path-with-locale';

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  linkHref: string | null;
  readAt: string | null;
  createdAt: string;
};

async function fetchNotifications(): Promise<{
  items: NotificationRow[];
  unreadCount: number;
}> {
  const r = await fetch('/api/notifications?limit=40', { credentials: 'include' });
  if (!r.ok) throw new Error('Failed to load');
  return r.json() as Promise<{ items: NotificationRow[]; unreadCount: number }>;
}

async function patchRead(id: string, read: boolean) {
  await fetch(`/api/notifications/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ read }),
  });
}

async function markAllRead() {
  const r = await fetch('/api/notifications/mark-all-read', {
    method: 'POST',
    credentials: 'include',
  });
  if (!r.ok) throw new Error('Failed');
}

function typeLabel(type: string) {
  if (type === 'page_published') return 'Published';
  if (type === 'error') return 'Error';
  if (type === 'user_action') return 'Activity';
  return type;
}

export default function DashboardNotificationsMenu({
  locale,
  role: _role,
}: {
  locale: string;
  role: Role;
}) {
  void _role;
  const { pushEscLayer } = useDashboardShortcuts();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const data = await fetchNotifications();
      setItems(data.items);
      setUnreadCount(data.unreadCount);
    } catch {
      setListError('Could not load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    void refresh();
  }, [open, refresh]);

  useEffect(() => {
    if (!open) return;
    return pushEscLayer(() => setOpen(false));
  }, [open, pushEscLayer]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const onOpenItem = async (n: NotificationRow) => {
    if (!n.readAt) {
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      void patchRead(n.id, true).catch(() => refresh());
    }
    if (n.linkHref) {
      setOpen(false);
      if (n.linkHref.startsWith('http')) {
        window.open(n.linkHref, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = n.linkHref;
      }
    }
  };

  const onMarkAll = async () => {
    try {
      await markAllRead();
      setItems((prev) =>
        prev.map((x) => ({ ...x, readAt: x.readAt ?? new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch {
      void refresh();
    }
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
      >
        <Bell size={20} strokeWidth={1.75} />
        {unreadCount > 0 ? (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="absolute right-0 z-30 mt-2 flex max-h-[min(70vh,24rem)] w-[min(calc(100vw-2rem),20rem)] flex-col rounded-2xl border border-slate-200/80 bg-white shadow-xl dark:border-slate-700/60 dark:bg-slate-900 sm:w-80"
          role="dialog"
          aria-label="Notifications"
        >
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Notifications
            </p>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => void onMarkAll()}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
            {loading && items.length === 0 ? (
              <div className="flex justify-center py-8 text-slate-500">
                <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
              </div>
            ) : null}
            {listError ? (
              <p className="px-2 py-4 text-center text-sm text-rose-600 dark:text-rose-400">
                {listError}
              </p>
            ) : null}
            {!listError && !loading && items.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-slate-600 dark:text-slate-400">
                You&apos;re all caught up.
              </p>
            ) : null}
            <ul className="space-y-1">
              {items.map((n) => {
                const unread = !n.readAt;
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => void onOpenItem(n)}
                      className={[
                        'w-full rounded-xl px-3 py-2.5 text-left transition-colors',
                        unread
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/40'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/80',
                      ].join(' ')}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={[
                            'mt-0.5 h-2 w-2 shrink-0 rounded-full',
                            unread ? 'bg-indigo-500' : 'bg-transparent',
                          ].join(' ')}
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            {typeLabel(n.type)}
                          </p>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {n.title}
                          </p>
                          {n.body ? (
                            <p className="mt-0.5 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">
                              {n.body}
                            </p>
                          ) : null}
                          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                            {new Date(n.createdAt).toLocaleString(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                            {n.linkHref ? ' · Open' : ''}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="shrink-0 border-t border-slate-100 px-4 py-2 dark:border-slate-800">
            <Link
              href={publicPathForLocale(locale, '/dashboard')}
              className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              onClick={() => setOpen(false)}
            >
              Dashboard home
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
