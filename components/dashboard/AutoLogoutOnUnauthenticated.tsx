'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

/**
 * Auto-redirect dashboards when the user session becomes unauthenticated
 * (logout click, token expiry, cookie cleared, etc.).
 */
export default function AutoLogoutOnUnauthenticated({ locale }: { locale: string }) {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status !== 'unauthenticated') return;

    // Best-effort clear cookies/token state.
    signOut({ redirect: false }).catch(() => {});

    const to = locale ? `/${locale}/login` : '/login';
    router.replace(to);
  }, [status, locale, router]);

  return null;
}

