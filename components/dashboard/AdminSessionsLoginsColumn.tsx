'use client';

import { useEffect, useState } from 'react';
import { Activity, LogIn } from 'lucide-react';
import { dashboardPanelClass } from '@/lib/dashboard-ui';

type Insights = {
  recentLogins: {
    id: string;
    loggedAt: string;
    loggedOutAt: string | null;
    userEmail: string;
    userName: string | null;
    userUsername: string | null;
    userRole: string;
  }[];
};

type ActiveSessionsResponse = {
  activeByUser: {
    userId: string;
    userEmail: string;
    userName: string | null;
    userUsername: string | null;
    userRole: string;
    deviceUserAgent: string | null;
    activeSessions: { id: string; loggedAt: string }[];
  }[];
};

function toDeviceLabel(ua: string | null) {
  if (!ua) return 'Unknown device';
  const s = ua.toLowerCase();
  if (s.includes('iphone') || s.includes('ipad')) return 'iOS (Safari/Browser)';
  if (s.includes('android')) return 'Android (Browser)';
  if (s.includes('mac os') || s.includes('macintosh')) return 'macOS (Browser)';
  if (s.includes('windows')) return 'Windows (Browser)';
  if (s.includes('linux')) return 'Linux (Browser)';
  return 'Browser';
}

type Props = {
  /** Narrow dashboard sidebar (`w-64`): tighter typography and scroll areas. */
  variant?: 'default' | 'sidebar';
  /** Show only one list (default: both). */
  view?: 'both' | 'sessions' | 'logins';
};

/** Active sessions + recent logins (admin APIs). */
export default function AdminSessionsLoginsColumn({ variant = 'default', view = 'both' }: Props) {
  const side = variant === 'sidebar';
  const [data, setData] = useState<Insights | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ActiveSessionsResponse | null>(null);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [logoutBusyUserId, setLogoutBusyUserId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/dashboard/admin-insights', { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then((json: Insights) => setData({ recentLogins: json.recentLogins ?? [] }))
      .catch(() => setError('Could not load recent logins'));
  }, []);

  useEffect(() => {
    fetch('/api/admin/sessions?activeOnly=1&take=200')
      .then(async (r) => {
        if (!r.ok) throw new Error('Failed to load');
        return (await r.json()) as ActiveSessionsResponse;
      })
      .then(setSessions)
      .catch(() => setSessionsError('Could not load active sessions'));
  }, []);

  async function forceLogoutUser(userId: string) {
    setLogoutBusyUserId(userId);
    try {
      const r = await fetch('/api/admin/sessions/force-logout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!r.ok) throw new Error('Failed');
      const refreshed = await fetch('/api/admin/sessions?activeOnly=1&take=200', { cache: 'no-store' });
      if (!refreshed.ok) throw new Error('Failed');
      setSessions((await refreshed.json()) as ActiveSessionsResponse);
    } catch {
      setSessionsError('Force logout failed');
    } finally {
      setLogoutBusyUserId(null);
    }
  }

  if (error) {
    return (
      <p
        className={
          side
            ? 'rounded-lg border border-red-200 bg-red-50/90 p-2 text-xs text-red-700'
            : 'rounded-xl border border-red-200 bg-white/90 p-4 text-sm text-red-600'
        }
      >
        {error}
      </p>
    );
  }

  const gap = side ? 'space-y-3' : 'space-y-6';
  const card = dashboardPanelClass;
  const head = side
    ? 'flex items-center gap-1.5 border-b border-indigo-100/70 bg-gradient-to-r from-indigo-50/90 to-white px-2.5 py-2 text-xs font-bold text-slate-900 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900 dark:text-slate-100'
    : 'flex items-center gap-2 border-b border-indigo-100/70 bg-gradient-to-r from-indigo-50/90 to-white p-5 text-lg font-bold text-slate-900 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900 dark:text-slate-100';
  const listMax = side ? 'max-h-52' : 'max-h-[min(24rem,50vh)]';
  const liPad = side ? 'p-2.5' : 'p-4';
  const bodyText = side ? 'text-xs' : 'text-sm';
  const iconAct = side ? 15 : 20;
  const iconLog = side ? 15 : 20;

  const showSessions = view === 'both' || view === 'sessions';
  const showLogins = view === 'both' || view === 'logins';

  return (
    <div className={gap}>
      {showSessions ? (
      <section className={card}>
        <h2 className={head}>
          <Activity size={iconAct} className="shrink-0 text-slate-600" />
          Active sessions
        </h2>
        {sessionsError ? (
          <p className={`${liPad} text-xs text-red-600`}>{sessionsError}</p>
        ) : !sessions ? (
          <p className={`${liPad} text-slate-500 ${bodyText}`}>Loading active sessions…</p>
        ) : sessions.activeByUser.length === 0 ? (
          <p className={`${liPad} text-slate-500 ${bodyText}`}>No active sessions right now.</p>
        ) : (
          <ul className={`divide-y divide-slate-100 dark:divide-slate-800 ${listMax} overflow-y-auto`}>
            {sessions.activeByUser.map((u) => (
              <li key={u.userId} className={`${liPad} ${bodyText}`}>
                <div
                  className={
                    side ? 'flex flex-col gap-2' : 'flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3'
                  }
                >
                  <div className="min-w-0">
                    <p className={`font-medium text-slate-900 ${side ? 'break-words' : ''}`}>
                      {u.userName?.trim() ? (
                        <span>{u.userName.trim()}</span>
                      ) : (
                        <span className="text-slate-500">No display name</span>
                      )}
                      {u.userUsername?.trim() ? (
                        <span className="text-slate-600"> · @{u.userUsername.trim()}</span>
                      ) : null}
                    </p>
                    <p className={`mt-0.5 text-slate-600 ${side ? 'break-all text-[11px] leading-snug' : ''}`}>
                      <span className="font-medium text-slate-800">{u.userRole}</span>
                      {' · '}
                      {u.userEmail}
                      {!side ? (
                        <>
                          {' · '}
                          {toDeviceLabel(u.deviceUserAgent)}
                        </>
                      ) : (
                        <span className="block text-slate-500">{toDeviceLabel(u.deviceUserAgent)}</span>
                      )}
                    </p>
                    <p
                      className={
                        side
                          ? 'mt-1 text-[11px] text-slate-500 leading-snug'
                          : 'mt-1 text-xs text-slate-500'
                      }
                    >
                      {side ? 'Latest: ' : 'Latest login: '}
                      {new Date(u.activeSessions[0]?.loggedAt ?? Date.now()).toLocaleString()}
                      {side ? ` · ×${u.activeSessions.length}` : ` · Active sessions: ${u.activeSessions.length}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => forceLogoutUser(u.userId)}
                    disabled={logoutBusyUserId === u.userId}
                    className={
                      side
                        ? 'w-full shrink-0 rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-[11px] font-medium text-red-700 hover:bg-red-100 disabled:opacity-60'
                        : 'shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 hover:bg-red-100 disabled:opacity-60'
                    }
                  >
                    {logoutBusyUserId === u.userId ? 'Logging out…' : 'Force logout'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      ) : null}

      {showLogins ? (
      <section className={card}>
        <h2 className={head}>
          <LogIn size={iconLog} className="shrink-0 text-slate-600" />
          Recent logins
        </h2>
        {!data ? (
          <p className={`${liPad} text-slate-500 ${bodyText}`}>Loading recent logins…</p>
        ) : (
          <ul className={`divide-y divide-slate-100 dark:divide-slate-800 ${listMax} overflow-y-auto`}>
            {data.recentLogins.length === 0 ? (
              <li className={`${liPad} text-slate-500 ${bodyText}`}>No login records yet.</li>
            ) : (
              data.recentLogins.map((l) => (
                <li key={l.id} className={`${liPad} ${bodyText}`}>
                  <p className={`font-medium text-slate-900 ${side ? 'break-words text-xs' : ''}`}>
                    {l.userName?.trim() ? l.userName.trim() : <span className="text-slate-500">No display name</span>}
                    {l.userUsername?.trim() ? (
                      <span className="font-normal text-slate-600"> · @{l.userUsername.trim()}</span>
                    ) : null}
                    <span
                      className={
                        side
                          ? 'mt-1 block w-fit rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                          : 'ml-2 inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                      }
                    >
                      {l.userRole}
                    </span>
                  </p>
                  <p className={`mt-0.5 text-slate-600 ${side ? 'break-all text-[11px]' : 'text-xs'}`}>{l.userEmail}</p>
                  <p className={`mt-1 text-slate-500 ${side ? 'text-[10px] leading-snug' : 'text-xs'}`}>
                    In: {new Date(l.loggedAt).toLocaleString()}
                    {l.loggedOutAt ? ` · Out: ${new Date(l.loggedOutAt).toLocaleString()}` : ' · Still active'}
                  </p>
                </li>
              ))
            )}
          </ul>
        )}
      </section>
      ) : null}
    </div>
  );
}
