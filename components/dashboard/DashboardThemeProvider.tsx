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
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s === 'dark' || s === 'light') return s;
  } catch {
    // private mode / blocked storage
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyDashboardDarkClass(mode: DashboardColorMode) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', mode === 'dark');
}

export function useDashboardTheme(): Ctx {
  const ctx = useContext(DashboardThemeContext);
  if (!ctx) {
    throw new Error('useDashboardTheme must be used inside DashboardThemeProvider');
  }
  return ctx;
}

export function DashboardThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<DashboardColorMode>(() => readStoredMode());

  useLayoutEffect(() => {
    // Ensure the <html> class is in sync on mount (including after refresh).
    applyDashboardDarkClass(mode);
  }, [mode]);

  const setMode = useCallback((m: DashboardColorMode) => {
    try {
      localStorage.setItem(STORAGE_KEY, m);
    } catch {
      // ignore
    }
    setModeState(m);
    applyDashboardDarkClass(m);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((prev) => {
      const next: DashboardColorMode = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore
      }
      applyDashboardDarkClass(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ mode, setMode, toggleMode }), [mode, setMode, toggleMode]);

  return (
    <DashboardThemeContext.Provider value={value}>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
        {children}
      </div>
    </DashboardThemeContext.Provider>
  );
}
