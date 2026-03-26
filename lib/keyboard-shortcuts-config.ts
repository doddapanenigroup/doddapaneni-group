/**
 * Dashboard keyboard shortcuts — editable here or overridden at runtime.
 *
 * **Modifier:** `mod: true` means ⌘ on Apple platforms and Ctrl on Windows/Linux.
 * That matches common app behavior and avoids fighting OS-specific docs (“Ctrl+K” vs “⌘K”).
 *
 * **Runtime overrides (client only):**
 * - `NEXT_PUBLIC_DASHBOARD_KEYBOARD_SHORTCUTS_JSON` — JSON partial merge, e.g.
 *   `{"search":{"enabled":false},"save":{"binding":{"key":"s","mod":true,"shift":true}}}`
 * - `window.__DASHBOARD_KEYBOARD_CONFIG__` — same shape, merged after env (highest priority).
 */

export type KeyBinding = {
  /** Single character or logical key name (e.g. `k`, `s`; matched case-insensitively for letters). */
  key: string;
  /**
   * Primary platform modifier: Meta (⌘) on macOS / iOS, Ctrl elsewhere.
   * Prevents the browser’s “Save page” (Ctrl/Cmd+S) when handled in-app.
   */
  mod: boolean;
  shift?: boolean;
};

export type DashboardKeyboardShortcutsConfig = {
  search: { enabled: boolean; binding: KeyBinding };
  save: { enabled: boolean; binding: KeyBinding };
  escapeClose: { enabled: boolean };
};

export const defaultDashboardKeyboardShortcuts: DashboardKeyboardShortcutsConfig = {
  search: { enabled: true, binding: { key: 'k', mod: true } },
  save: { enabled: true, binding: { key: 's', mod: true } },
  escapeClose: { enabled: true },
};

function deepMerge(
  base: DashboardKeyboardShortcutsConfig,
  patch: Partial<DashboardKeyboardShortcutsConfig>
): DashboardKeyboardShortcutsConfig {
  return {
    search: {
      enabled: patch.search?.enabled ?? base.search.enabled,
      binding: {
        ...base.search.binding,
        ...patch.search?.binding,
      },
    },
    save: {
      enabled: patch.save?.enabled ?? base.save.enabled,
      binding: {
        ...base.save.binding,
        ...patch.save?.binding,
      },
    },
    escapeClose: {
      enabled: patch.escapeClose?.enabled ?? base.escapeClose.enabled,
    },
  };
}

function readWindowOverride(): Partial<DashboardKeyboardShortcutsConfig> | null {
  if (typeof window === 'undefined') return null;
  const w = (window as unknown as { __DASHBOARD_KEYBOARD_CONFIG__?: unknown })
    .__DASHBOARD_KEYBOARD_CONFIG__;
  if (w && typeof w === 'object') {
    return w as Partial<DashboardKeyboardShortcutsConfig>;
  }
  return null;
}

function readEnvOverride(): Partial<DashboardKeyboardShortcutsConfig> | null {
  const raw = process.env.NEXT_PUBLIC_DASHBOARD_KEYBOARD_SHORTCUTS_JSON;
  if (!raw?.trim()) return null;
  try {
    return JSON.parse(raw) as Partial<DashboardKeyboardShortcutsConfig>;
  } catch {
    return null;
  }
}

/** Resolve merged config (call on client after mount for env + window overrides). */
export function getDashboardKeyboardConfig(): DashboardKeyboardShortcutsConfig {
  const env = readEnvOverride();
  const win = readWindowOverride();
  let acc = defaultDashboardKeyboardShortcuts;
  if (env) acc = deepMerge(acc, env);
  if (win) acc = deepMerge(acc, win);
  return acc;
}
