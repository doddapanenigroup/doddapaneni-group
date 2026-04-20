import type { Role } from '@/lib/constants';
import {
  hasAdminAccess,
  hasDeveloperAccess,
  hasMarketerAccess,
} from '@/lib/role-utils';

const ANALYTICS_DASHBOARD_ROLES: readonly Role[] = ['DIGITAL_MARKETER', 'ADMIN', 'SUPER_ADMIN'];

export function canAccessDeveloperDashboard(role: Role | null | undefined): boolean {
  return hasDeveloperAccess(role);
}

export function canAccessMarketerDashboard(role: Role | null | undefined): boolean {
  return hasMarketerAccess(role);
}

/** Primary admin UI: `ADMIN` and `SUPER_ADMIN` (same route; super-only tools are gated in the page). */
export function canAccessAdminDashboard(role: Role | null | undefined): boolean {
  return hasAdminAccess(role);
}

export function canAccessEmployeesDashboard(role: Role | null | undefined): boolean {
  return hasAdminAccess(role);
}

export function canAccessAnalyticsDashboard(role: Role | null | undefined): boolean {
  return role != null && ANALYTICS_DASHBOARD_ROLES.includes(role);
}
