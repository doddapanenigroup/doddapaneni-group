'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type Value = {
  sidebarBelow: React.ReactNode | null;
  setSidebarBelow: (node: React.ReactNode | null) => void;
};

const DashboardSidebarBelowContext = createContext<Value | null>(null);

export function DashboardSidebarBelowProvider({ children }: { children: React.ReactNode }) {
  const [sidebarBelow, setSidebarBelowState] = useState<React.ReactNode | null>(null);
  const setSidebarBelow = useCallback((node: React.ReactNode | null) => {
    setSidebarBelowState(node);
  }, []);
  const value = useMemo(
    () => ({ sidebarBelow, setSidebarBelow }),
    [sidebarBelow, setSidebarBelow],
  );
  return (
    <DashboardSidebarBelowContext.Provider value={value}>{children}</DashboardSidebarBelowContext.Provider>
  );
}

export function useDashboardSidebarBelowOptional(): Value | null {
  return useContext(DashboardSidebarBelowContext);
}

export function useDashboardSidebarBelow(): Value {
  const v = useContext(DashboardSidebarBelowContext);
  if (!v) {
    throw new Error('useDashboardSidebarBelow requires DashboardSidebarBelowProvider');
  }
  return v;
}

/** Renders marketer (or other) content directly under the Navigate card in the left sidebar. */
export function DashboardSidebarBelowSlot() {
  const ctx = useContext(DashboardSidebarBelowContext);
  if (!ctx?.sidebarBelow) return null;
  return <div className="min-w-0 shrink-0">{ctx.sidebarBelow}</div>;
}
