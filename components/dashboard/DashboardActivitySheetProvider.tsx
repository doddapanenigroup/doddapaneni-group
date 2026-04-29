'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type ActivitySheetKind = 'recent' | 'marketing';

type Value = {
  activitySheet: ActivitySheetKind | null;
  openActivitySheet: (kind: ActivitySheetKind) => void;
  closeActivitySheet: () => void;
};

const Ctx = createContext<Value | null>(null);

export function DashboardActivitySheetProvider({ children }: { children: React.ReactNode }) {
  const [activitySheet, setActivitySheet] = useState<ActivitySheetKind | null>(null);
  const openActivitySheet = useCallback((kind: ActivitySheetKind) => {
    setActivitySheet(kind);
  }, []);
  const closeActivitySheet = useCallback(() => setActivitySheet(null), []);
  const value = useMemo(
    () => ({ activitySheet, openActivitySheet, closeActivitySheet }),
    [activitySheet, openActivitySheet, closeActivitySheet],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDashboardActivitySheetOptional(): Value | null {
  return useContext(Ctx);
}
