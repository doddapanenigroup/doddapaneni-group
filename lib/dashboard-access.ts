import type { Role } from '@/lib/constants';
import {
  hasAdminAccess,
  hasDeveloperAccess,
  hasMarketerAccess,
  isAdmin,
  isSuperAdmin,
} from '@/lib/role-utils';

const ANALYTICS_DASHBOARD_ROLES: readonly Role[] = ['DIGITAL_MARKETER', 'ADMIN', 'SUPER_ADMIN'];

export function canAccessDeveloperDashboard(role: Role | null | undefined): boolean {
  return hasDeveloperAccess(role);
}

export function canAccessMarketerDashboard(role: Role | null | undefined): boolean {
  return hasMarketerAccess(role);
}

export function canAccessAdminDashboard(role: Role | null | undefined): boolean {
  return isAdmin(role);
}

export function canAccessSuperAdminDashboard(role: Role | null | undefined): boolean {
  return isSuperAdmin(role);
}

export function canAccessEmployeesDashboard(role: Role | null | undefined): boolean {
  return hasAdminAccess(role);
}

export function canAccessAnalyticsDashboard(role: Role | null | undefined): boolean {
  return role != null && ANALYTICS_DASHBOARD_ROLES.includes(role);
}
