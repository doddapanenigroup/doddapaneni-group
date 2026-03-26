'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import {
  defaultDashboardKeyboardShortcuts,
  getDashboardKeyboardConfig,
  type DashboardKeyboardShortcutsConfig,
} from '@/lib/keyboard-shortcuts-config';
import { keyboardBindingMatches } from '@/lib/keyboard-shortcuts';

type DashboardShortcutsContextValue = {
  configRef: React.MutableRefObject<DashboardKeyboardShortcutsConfig>;
  registerSearchToggle: (fn: (() => void) | null) => void;
  pushEscLayer: (close: () => void) => () => void;
  pushSaveLayer: (save: () => void) => () => void;
};

const DashboardShortcutsContext =
  createContext<DashboardShortcutsContextValue | null>(null);

export function DashboardShortcutsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const configRef = useRef<DashboardKeyboardShortcutsConfig>(
    defaultDashboardKeyboardShortcuts
  );
  const searchToggleRef = useRef<(() => void) | null>(null);
  const escLayersRef = useRef<(() => void)[]>([]);
  const saveLayersRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    configRef.current = getDashboardKeyboardConfig();
  }, []);

  const registerSearchToggle = useCallback((fn: (() => void) | null) => {
    searchToggleRef.current = fn;
  }, []);

  const pushEscLayer = useCallback((close: () => void) => {
    escLayersRef.current.push(close);
    return () => {
      const ix = escLayersRef.current.lastIndexOf(close);
      if (ix >= 0) escLayersRef.current.splice(ix, 1);
    };
  }, []);

  const pushSaveLayer = useCallback((save: () => void) => {
    saveLayersRef.current.push(save);
    return () => {
      const ix = saveLayersRef.current.lastIndexOf(save);
      if (ix >= 0) saveLayersRef.current.splice(ix, 1);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const cfg = configRef.current;

      if (
        cfg.search.enabled &&
        keyboardBindingMatches(e, cfg.search.binding)
      ) {
        e.preventDefault();
        e.stopPropagation();
        searchToggleRef.current?.();
        return;
      }

      if (cfg.save.enabled && keyboardBindingMatches(e, cfg.save.binding)) {
        const stack = saveLayersRef.current;
        if (stack.length === 0) return;
        e.preventDefault();
        e.stopPropagation();
        stack[stack.length - 1]!();
        return;
      }

      if (cfg.escapeClose.enabled && e.key === 'Escape') {
        const stack = escLayersRef.current;
        if (stack.length === 0) return;
        e.preventDefault();
        e.stopPropagation();
        stack[stack.length - 1]!();
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, []);

  const value = useMemo(
    () =>
      ({
        configRef,
        registerSearchToggle,
        pushEscLayer,
        pushSaveLayer,
      }) satisfies DashboardShortcutsContextValue,
    [registerSearchToggle, pushEscLayer, pushSaveLayer]
  );

  return (
    <DashboardShortcutsContext.Provider value={value}>
      {children}
    </DashboardShortcutsContext.Provider>
  );
}

export function useDashboardShortcuts(): DashboardShortcutsContextValue {
  const ctx = useContext(DashboardShortcutsContext);
  if (!ctx) {
    throw new Error(
      'useDashboardShortcuts must be used under DashboardShortcutsProvider'
    );
  }
  return ctx;
}

/** Optional: panels outside the provider should no-op instead of throwing. */
export function useDashboardShortcutsOptional(): DashboardShortcutsContextValue | null {
  return useContext(DashboardShortcutsContext);
}
