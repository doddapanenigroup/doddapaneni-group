'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import type { Role } from '@/lib/constants';

const DASHBOARD_PATH_BY_ROLE: Record<Role, string> = {
  SUPER_ADMIN: 'admin',
  ADMIN: 'admin',
  DEVELOPER: 'developer',
  DIGITAL_MARKETER: 'marketer',
};

export default function RecordDashboardVisit() {
  const { data: session, status } = useSession();
  const lastVisitKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const role = session?.user?.role as Role | undefined;
    const userId = session?.user?.id;
    if (status !== 'authenticated' || !role || !userId) return;

    const visitKey = `${userId}:${role}`;
    if (lastVisitKeyRef.current === visitKey) return;
    lastVisitKeyRef.current = visitKey;

    const path = DASHBOARD_PATH_BY_ROLE[role];

    fetch('/api/dashboard-visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, role, userId }),
    }).catch(() => {});
  }, [session?.user?.id, session?.user?.role, status]);

  return null;
}
