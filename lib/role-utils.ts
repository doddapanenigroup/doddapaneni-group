import type { Role } from '@/lib/constants';

export function isSuperAdmin(role: Role | null | undefined): boolean {
  return role === 'SUPER_ADMIN';
}

export function isAdmin(role: Role | null | undefined): boolean {
  return role === 'ADMIN';
}

export function isDeveloper(role: Role | null | undefined): boolean {
  return role === 'DEVELOPER';
}

export function isMarketer(role: Role | null | undefined): boolean {
  return role === 'DIGITAL_MARKETER';
}

export function hasAdminAccess(role: Role | null | undefined): boolean {
  return isSuperAdmin(role) || isAdmin(role);
}

export function hasDeveloperAccess(role: Role | null | undefined): boolean {
  return hasAdminAccess(role) || isDeveloper(role);
}

export function hasMarketerAccess(role: Role | null | undefined): boolean {
  return hasAdminAccess(role) || isMarketer(role);
}

export function isDashboardRole(role: Role | null | undefined): boolean {
  return (
    role === 'SUPER_ADMIN' ||
    role === 'ADMIN' ||
    role === 'DEVELOPER' ||
    role === 'DIGITAL_MARKETER'
  );
}
