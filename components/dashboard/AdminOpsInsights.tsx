'use client';

import { useEffect, useState } from 'react';
import { Activity, BarChart3, Globe, Megaphone, Timer } from 'lucide-react';

type Insights = {
  recentLogins: {
    id: string;
    loggedAt: string;
    loggedOutAt: string | null;
    userEmail: string;
    userRole: string;
  }[];
  contentEdits: {
    id: string;
    createdAt: string;
    userEmail: string;
    userRole: string;
    kind: string;
    targetPath: string;
    summary: string | null;
  }[];
  marketingActivity: {
    id: string;
    createdAt: string;
    userEmail: string;
    userRole: string;
    entity: string;
    action: string;
    seoNote: string | null;
  }[];
  visitsLast7Days: number;
  dashboardVisitsByRole: { role: string; count: number }[];
  webVitals7d: { name: string; avgValue: number | null; samples: number }[];
};

type ActiveSessionsResponse = {
  activeByUser: {
    userId: string;
    userEmail: string;
    userName: string | null;
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

export default function AdminOpsInsights() {
  const [data, setData] = useState<Insights | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ActiveSessionsResponse | null>(null);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [logoutBusyUserId, setLogoutBusyUserId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/dashboard/admin-insights')
      .then(async (r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then(setData)
      .catch(() => setError('Could not load admin insights'));
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
      const refreshed = await fetch('/api/admin/sessions?activeOnly=1&take=200');
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
      <p className="text-sm text-red-600 bg-white/90 rounded-xl border border-red-200 p-4">{error}</p>
    );
  }
  if (!data) {
    return (
      <p className="text-sm text-slate-500 bg-white/90 rounded-xl border border-slate-200 p-4">
        Loading operations overview…
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.07)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/25">
        <h2 className="text-lg font-semibold text-slate-800 p-5 border-b border-slate-100/95 bg-gradient-to-r from-slate-50/98 to-white dark:border-slate-800 dark:from-slate-800/45 dark:to-slate-900/85 flex items-center gap-2">
          <Activity size={20} className="text-slate-600" />
          Active sessions
        </h2>
        {sessionsError ? (
          <p className="p-4 text-sm text-red-600">{sessionsError}</p>
        ) : !sessions ? (
          <p className="p-4 text-sm text-slate-500">Loading active sessions…</p>
        ) : sessions.activeByUser.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">No active sessions right now.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {sessions.activeByUser.map((u) => (
              <li key={u.userId} className="p-4 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">
                      {u.userEmail}
                      {u.userName ? <span className="text-slate-500"> · {u.userName}</span> : null}
                    </p>
                    <p className="text-slate-600">
                      {u.userRole} · {toDeviceLabel(u.deviceUserAgent)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Latest login:{' '}
                      {new Date(u.activeSessions[0]?.loggedAt ?? Date.now()).toLocaleString()}
                      {' · '}Active sessions: {u.activeSessions.length}
                    </p>
                  </div>
                  <button
                    onClick={() => forceLogoutUser(u.userId)}
                    disabled={logoutBusyUserId === u.userId}
                    className="text-xs px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-60"
                  >
                    {logoutBusyUserId === u.userId ? 'Logging out…' : 'Force logout'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.07)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/25">
        <h2 className="text-lg font-semibold text-slate-800 p-5 border-b border-slate-100/95 bg-gradient-to-r from-slate-50/98 to-white dark:border-slate-800 dark:from-slate-800/45 dark:to-slate-900/85 flex items-center gap-2">
          <BarChart3 size={20} className="text-slate-600" />
          Traffic &amp; performance (7 days)
        </h2>
        <div className="p-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500 flex items-center gap-1">
              <Globe size={14} /> Public visits
            </p>
            <p className="text-2xl font-semibold text-slate-900 mt-1">{data.visitsLast7Days}</p>
          </div>
          {data.webVitals7d.map((w) => (
            <div key={w.name} className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500 flex items-center gap-1">
                <Timer size={14} /> {w.name} (avg)
              </p>
              <p className="text-2xl font-semibold text-slate-900 mt-1">
                {w.avgValue != null ? Math.round(w.avgValue * 100) / 100 : '—'}
              </p>
              <p className="text-xs text-slate-500 mt-1">{w.samples} samples</p>
            </div>
          ))}
        </div>
        {data.dashboardVisitsByRole.length > 0 && (
          <div className="px-5 pb-5">
            <p className="text-xs font-medium text-slate-600 mb-2">Dashboard opens by role (7d)</p>
            <ul className="flex flex-wrap gap-2">
              {data.dashboardVisitsByRole.map((d) => (
                <li
                  key={d.role}
                  className="text-xs px-2 py-1 rounded-lg bg-slate-200/80 text-slate-800"
                >
                  {d.role}: {d.count}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.07)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/25">
        <h2 className="text-lg font-semibold text-slate-800 p-5 border-b border-slate-100/95 bg-gradient-to-r from-slate-50/98 to-white dark:border-slate-800 dark:from-slate-800/45 dark:to-slate-900/85 flex items-center gap-2">
          <Activity size={20} className="text-slate-600" />
          Recent logins
        </h2>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
          {data.recentLogins.length === 0 ? (
            <li className="p-4 text-sm text-slate-500">No login records yet.</li>
          ) : (
            data.recentLogins.map((l) => (
              <li key={l.id} className="p-4 text-sm">
                <span className="font-medium text-slate-900">{l.userEmail}</span>
                <span className="text-slate-500"> · {l.userRole}</span>
                <br />
                <span className="text-xs text-slate-500">
                  In: {new Date(l.loggedAt).toLocaleString()}
                  {l.loggedOutAt ? ` · Out: ${new Date(l.loggedOutAt).toLocaleString()}` : ' · Still active'}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.07)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/25">
        <h2 className="text-lg font-semibold text-slate-800 p-5 border-b border-slate-100/95 bg-gradient-to-r from-slate-50/98 to-white dark:border-slate-800 dark:from-slate-800/45 dark:to-slate-900/85">
          Developer edits (files &amp; CMS)
        </h2>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto text-sm">
          {data.contentEdits.length === 0 ? (
            <li className="p-4 text-slate-500">No edits recorded yet.</li>
          ) : (
            data.contentEdits.map((c) => (
              <li key={c.id} className="p-4">
                <span className="font-mono text-xs text-slate-600">{c.kind}</span>{' '}
                <span className="font-medium">{c.targetPath}</span>
                <span className="text-slate-500"> · {c.userEmail}</span>
                <br />
                <span className="text-xs text-slate-500">{new Date(c.createdAt).toLocaleString()}</span>
                {c.summary && <span className="text-xs text-slate-600 block mt-1">{c.summary}</span>}
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.07)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/25">
        <h2 className="text-lg font-semibold text-slate-800 p-5 border-b border-slate-100/95 bg-gradient-to-r from-slate-50/98 to-white dark:border-slate-800 dark:from-slate-800/45 dark:to-slate-900/85 flex items-center gap-2">
          <Megaphone size={20} className="text-slate-600" />
          Digital marketer / SEO-related changes
        </h2>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto text-sm">
          {data.marketingActivity.length === 0 ? (
            <li className="p-4 text-slate-500">No marketing activity logged yet.</li>
          ) : (
            data.marketingActivity.map((m) => (
              <li key={m.id} className="p-4">
                <span className="font-medium capitalize">{m.action}</span>{' '}
                <span className="text-slate-600">{m.entity}</span>
                <span className="text-slate-500"> · {m.userEmail}</span>
                <br />
                <span className="text-xs text-slate-500">{new Date(m.createdAt).toLocaleString()}</span>
                {m.seoNote && (
                  <span className="text-xs text-slate-700 block mt-1">SEO note: {m.seoNote}</span>
                )}
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
