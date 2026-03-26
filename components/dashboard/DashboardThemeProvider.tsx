'use client';

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';

const STORAGE_KEY = 'dashboard-theme';
export type DashboardColorMode = 'light' | 'dark';

type Ctx = {
  mode: DashboardColorMode;
  setMode: (m: DashboardColorMode) => void;
  toggleMode: () => void;
};

const DashboardThemeContext = createContext<Ctx | null>(null);

function readStoredMode(): DashboardColorMode {
  if (typeof window === 'undefined') return 'light';
  const s = localStorage.getItem(STORAGE_KEY);
  if (s === 'dark' || s === 'light') return s;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useDashboardTheme(): Ctx {
  const ctx = useContext(DashboardThemeContext);
  if (!ctx) {
    throw new Error('useDashboardTheme must be used inside DashboardThemeProvider');
  }
  return ctx;
}

export function DashboardThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<DashboardColorMode>('light');

  useLayoutEffect(() => {
    setModeState(readStoredMode());
  }, []);

  const setMode = useCallback((m: DashboardColorMode) => {
    localStorage.setItem(STORAGE_KEY, m);
    setModeState(m);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((prev) => {
      const next: DashboardColorMode = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ mode, setMode, toggleMode }), [mode, setMode, toggleMode]);

  const isDark = mode === 'dark';

  return (
    <DashboardThemeContext.Provider value={value}>
      <div className={isDark ? 'dark' : ''}>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
          {children}
        </div>
      </div>
    </DashboardThemeContext.Provider>
  );
}
