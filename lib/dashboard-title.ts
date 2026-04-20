import type { Role } from '@/lib/constants';

/**
 * Sidebar + ⌘K link to `/dashboard/marketer` for every role that has access
 * (super admin, admin, digital marketer) — not only the “Digital Marketer” job title.
 */
export const MARKETING_DASHBOARD_NAV_LABEL = 'Content & marketing' as const;

const ROLE_LABEL_BY_ROLE = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  DEVELOPER: 'Developer',
  DIGITAL_MARKETER: 'Digital Marketer',
} as const satisfies Record<Role, string>;

const DASHBOARD_TITLE_BY_ROLE = {
  SUPER_ADMIN: 'Admin Dashboard',
  ADMIN: 'Admin Dashboard',
  DEVELOPER: 'Developer Dashboard',
  DIGITAL_MARKETER: 'Digital Marketer Dashboard',
} as const satisfies Record<Role, string>;

export function getRoleLabel(role: Role): string {
  return ROLE_LABEL_BY_ROLE[role];
}

export function getDashboardTitle(role: Role): string {
  return DASHBOARD_TITLE_BY_ROLE[role];
}
