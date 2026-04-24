import type { Role } from '@/lib/constants';
import {
  hasAdminAccess,
  hasDeveloperAccess,
  hasMarketerAccess,
} from '@/lib/role-utils';

/**
 * Dashboard route helpers — all delegate to `lib/role-utils` so page gates and API checks
 * can import one semantic name and stay aligned.
 */

export function canAccessDeveloperDashboard(role: Role | null | undefined): boolean {
  return hasDeveloperAccess(role);
}

export function canAccessMarketerDashboard(role: Role | null | undefined): boolean {
  return hasMarketerAccess(role);
}

/** Primary admin UI: `ADMIN`. */
export function canAccessAdminDashboard(role: Role | null | undefined): boolean {
  return hasAdminAccess(role);
}

export function canAccessEmployeesDashboard(role: Role | null | undefined): boolean {
  return hasAdminAccess(role);
}
