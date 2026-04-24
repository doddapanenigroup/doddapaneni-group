import type { Role } from './constants';

/**
 * data-theme attribute values for each role.
 * Used by RoleThemeProvider and for any role-based styling.
 */
export const ROLE_THEMES: Record<Role, string> = {
  ADMIN: 'admin',
  DEVELOPER: 'developer',
  DIGITAL_MARKETER: 'marketer',
} as const;

export type ThemeId = (typeof ROLE_THEMES)[keyof typeof ROLE_THEMES];

/**
 * Get the theme id (data-theme value) for a role.
 * Returns undefined if role is not a known role (e.g. unauthenticated).
 */
export function getThemeForRole(role: string | undefined | null): ThemeId | undefined {
  if (!role) return undefined;
  return ROLE_THEMES[role as Role] ?? undefined;
}
