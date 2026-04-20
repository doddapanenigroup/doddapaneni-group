'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';

const iconActionClass =
  'relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-800';

type NotifItem = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  linkHref: string | null;
  read: boolean;
  createdAt: string;
};

function timeLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

export default function DashboardNotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotifItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications?limit=40', { credentials: 'include' });
      if (!res.ok) return;
      const json = (await res.json()) as {
        unreadCount?: number;
        items?: NotifItem[];
      };
      if (Array.isArray(json.items)) {
        setItems(json.items);
      }
      if (typeof json.unreadCount === 'number') {
        setUnreadCount(json.unreadCount);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => {
      void load();
    }, 60_000);
    return () => clearInterval(t);
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const markAllRead = async () => {
    if (unreadCount === 0) return;
    setMarkingAll(true);
    try {
      const res = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } finally {
      setMarkingAll(false);
    }
  };

  const onItemClick = async (n: NotifItem) => {
    if (!n.read) {
      const res = await fetch(`/api/notifications/${n.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ read: true }),
      });
      if (res.ok) {
        setItems((prev) => prev.map((p) => (p.id === n.id ? { ...p, read: true } : p)));
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    }
    if (n.linkHref) {
      setOpen(false);
      router.push(n.linkHref);
    }
  };

  return (
    <div ref={rootRef} className="relative z-30">
      <button
        type="button"
        onClick={async () => {
          setOpen((o) => !o);
          if (!open) {
            void load();
          }
        }}
        className={iconActionClass}
        title="Notifications"
        aria-label="Notifications"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Bell size={18} className="opacity-85" />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(20rem,calc(100vw-1.5rem))] max-h-96 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-900"
          role="dialog"
          aria-label="Notifications"
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2.5 dark:border-slate-700/80">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Notifications</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={() => void markAllRead()}
                  disabled={markingAll}
                  className="text-xs font-medium text-slate-600 underline-offset-2 hover:underline dark:text-slate-300 disabled:opacity-50"
                >
                  {markingAll ? 'Marking…' : 'Mark all read'}
                </button>
              ) : null}
            </div>
          </div>
          <div className="max-h-[min(20rem,70vh)] overflow-y-auto">
            {loading && items.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">Loading…</p>
            ) : items.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">No notifications yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => void onItemClick(n)}
                      className={`w-full text-left px-3 py-2.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/80 ${
                        n.read ? 'text-slate-600 dark:text-slate-400' : 'bg-slate-50/80 font-medium text-slate-900 dark:bg-slate-800/40 dark:text-slate-100'
                      }`}
                    >
                      <p className="line-clamp-2">{n.title}</p>
                      {n.message && n.message !== n.title ? (
                        <p className="mt-0.5 line-clamp-1 text-xs font-normal text-slate-500 dark:text-slate-500">
                          {n.message}
                        </p>
                      ) : null}
                      <p className="mt-1 text-[10px] text-slate-400">{timeLabel(n.createdAt)}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
