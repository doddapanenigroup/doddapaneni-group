import type { Role } from '@/lib/constants';

/**
 * Sidebar + ⌘K link to `/dashboard/marketer` for every role that has access
 * (admin, digital marketer) — not only the “Digital Marketer” job title.
 */
export const MARKETING_DASHBOARD_NAV_LABEL = 'Content & marketing' as const;

/** Sidebar + ⌘K link to `/dashboard/hr` (Admin + HR). */
export const HR_DASHBOARD_NAV_LABEL = 'Career applications' as const;

const ROLE_LABEL_BY_ROLE = {
  ADMIN: 'Admin',
  DEVELOPER: 'Developer',
  DIGITAL_MARKETER: 'Digital Marketer',
  HR: 'HR',
} as const satisfies Record<Role, string>;

const DASHBOARD_TITLE_BY_ROLE = {
  ADMIN: 'Admin Dashboard',
  DEVELOPER: 'Developer Dashboard',
  DIGITAL_MARKETER: 'Digital Marketer Dashboard',
  HR: 'HR — Career applications',
} as const satisfies Record<Role, string>;

export function getRoleLabel(role: Role): string {
  return ROLE_LABEL_BY_ROLE[role];
}

export function getDashboardTitle(role: Role): string {
  return DASHBOARD_TITLE_BY_ROLE[role];
}
