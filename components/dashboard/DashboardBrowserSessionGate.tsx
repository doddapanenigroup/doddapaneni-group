'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { publicPathForLocale } from '@/lib/public-path-with-locale';
import {
  DASHBOARD_BROWSER_SESSION_BC,
  DASHBOARD_BROWSER_SESSION_KEY,
} from '@/lib/dashboard-browser-session';

function requestSessionTokenFromPeers(timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    let bc: BroadcastChannel;
    try {
      bc = new BroadcastChannel(DASHBOARD_BROWSER_SESSION_BC);
    } catch {
      resolve(false);
      return;
    }

    const finish = (ok: boolean) => {
      clearTimeout(timer);
      clearInterval(poll);
      bc.close();
      resolve(ok);
    };

    const timer = window.setTimeout(() => {
      finish(sessionStorage.getItem(DASHBOARD_BROWSER_SESSION_KEY) != null);
    }, timeoutMs);

    const poll = window.setInterval(() => {
      bc.postMessage({ type: 'REQUEST_TOKEN' });
    }, 130);

    bc.onmessage = (ev: MessageEvent) => {
      const d = ev.data as { type?: string; token?: string };
      if (d?.type === 'TOKEN_OFFER' && typeof d.token === 'string' && d.token.length > 0) {
        sessionStorage.setItem(DASHBOARD_BROWSER_SESSION_KEY, d.token);
        finish(true);
      }
    };

    bc.postMessage({ type: 'REQUEST_TOKEN' });
  });
}

/**
 * Logs the user out and sends them home when the JWT cookie still exists but this browser
 * session has no tab-local marker — i.e. the user closed all tabs/windows and reopened the site.
 * Uses BroadcastChannel so extra tabs opened while one dashboard tab stays open keep working.
 */
export default function DashboardBrowserSessionGate({ locale }: { locale: string }) {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status !== 'authenticated') return;
    // Without BroadcastChannel we cannot sync a new tab with an existing one; skipping avoids
    // false logouts on secondary tabs in legacy environments (JWT cookie would still persist).
    if (typeof BroadcastChannel === 'undefined') return;

    const home = publicPathForLocale(locale, '/');
    let cancelled = false;
    let responder: BroadcastChannel | null = null;

    async function init() {
      if (!sessionStorage.getItem(DASHBOARD_BROWSER_SESSION_KEY)) {
        await requestSessionTokenFromPeers(450);
        if (cancelled) return;
        if (!sessionStorage.getItem(DASHBOARD_BROWSER_SESSION_KEY)) {
          await signOut({ redirect: false });
          if (!cancelled) router.replace(home);
          return;
        }
      }

      try {
        responder = new BroadcastChannel(DASHBOARD_BROWSER_SESSION_BC);
        responder.onmessage = (ev: MessageEvent) => {
          const d = ev.data as { type?: string };
          if (d?.type !== 'REQUEST_TOKEN') return;
          const token = sessionStorage.getItem(DASHBOARD_BROWSER_SESSION_KEY);
          if (token && responder) {
            responder.postMessage({ type: 'TOKEN_OFFER', token });
          }
        };
      } catch {
        /* ignore */
      }
    }

    void init();

    return () => {
      cancelled = true;
      responder?.close();
    };
  }, [status, locale, router]);

  return null;
}
