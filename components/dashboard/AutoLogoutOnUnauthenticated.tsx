'use client';

import { useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

function getLocaleFromPath(pathname: string | null): string | null {
  if (!pathname) return null;
  const segs = pathname.split('/').filter(Boolean);
  return segs[0] ?? null;
}

/**
 * Auto-redirect dashboards when the user session becomes unauthenticated
 * (logout click, token expiry, cookie cleared, etc.).
 */
export default function AutoLogoutOnUnauthenticated() {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useSession();

  const locale = useMemo(() => getLocaleFromPath(pathname), [pathname]);
  const isOnDashboard = useMemo(() => {
    if (!pathname) return false;
    return pathname.includes('/dashboard');
  }, [pathname]);

  useEffect(() => {
    if (!isOnDashboard) return;
    if (status !== 'unauthenticated') return;

    // Best-effort clear cookies/token state.
    signOut({ redirect: false }).catch(() => {});

    const to = locale ? `/${locale}/login` : '/login';
    router.replace(to);
  }, [isOnDashboard, status, locale, router]);

  return null;
}

