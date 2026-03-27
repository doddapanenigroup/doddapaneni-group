import type { Role } from '@/lib/constants';

const ROLE_LABEL_BY_ROLE = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  DEVELOPER: 'Developer',
  DIGITAL_MARKETER: 'Digital Marketer',
} as const satisfies Record<Role, string>;

const DASHBOARD_TITLE_BY_ROLE = {
  SUPER_ADMIN: 'Super Admin Dashboard',
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
