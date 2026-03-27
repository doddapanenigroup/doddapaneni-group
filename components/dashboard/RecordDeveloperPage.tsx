'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { isDeveloper } from '@/lib/role-utils';

export default function RecordDeveloperPage({ locale }: { locale: string }) {
  const { data: session, status } = useSession();
  const hasPostedRef = useRef(false);

  useEffect(() => {
    if (status !== 'authenticated' || !isDeveloper(session?.user?.role as any)) return;
    if (hasPostedRef.current) return;
    hasPostedRef.current = true;

    fetch('/api/developer-activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: `/${locale}/dashboard/developer` }),
    }).catch(() => {});
  }, [locale, session?.user?.role, status]);

  return null;
}
