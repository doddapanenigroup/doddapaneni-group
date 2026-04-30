'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { publicPathForLocale } from '@/lib/public-path-with-locale';
import type { AdminMainSection } from '@/lib/admin-dashboard-nav';

export type { AdminMainSection } from '@/lib/admin-dashboard-nav';

type Value = {
  section: AdminMainSection;
  setSection: (s: AdminMainSection) => void;
};

const Ctx = createContext<Value | null>(null);

export function AdminNavProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const locale = typeof params?.locale === 'string' ? params.locale : '';
  const adminHome = locale ? publicPathForLocale(locale, '/dashboard/admin') : '';

  const [section, setSection] = useState<AdminMainSection>('overview');

  useEffect(() => {
    if (!adminHome) return;
    if (pathname === adminHome) return;
    setSection('overview');
  }, [pathname, adminHome]);

  const value = useMemo(() => ({ section, setSection }), [section]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminNav(): Value {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAdminNav requires AdminNavProvider');
  return v;
}

export function useAdminNavOptional(): Value | null {
  return useContext(Ctx);
}
