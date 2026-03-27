'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import type { Role } from '@/lib/constants';

const DASHBOARD_PATH_BY_ROLE: Record<Role, string> = {
  SUPER_ADMIN: 'super-admin',
  ADMIN: 'admin',
  DEVELOPER: 'developer',
  DIGITAL_MARKETER: 'marketer',
};

export default function RecordDashboardVisit() {
  const { data: session, status } = useSession();
  const lastRoleRef = useRef<Role | null>(null);

  useEffect(() => {
    const role = session?.user?.role as Role | undefined;
    if (status !== 'authenticated' || !role) return;
    if (lastRoleRef.current === role) return;
    lastRoleRef.current = role;

    const path = DASHBOARD_PATH_BY_ROLE[role];

    fetch('/api/dashboard-visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    }).catch(() => {});
  }, [session?.user?.role, status]);

  return null;
}
