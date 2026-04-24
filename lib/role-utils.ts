import type { Role } from '@/lib/constants';

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
  return isAdmin(role);
}

export function hasDeveloperAccess(role: Role | null | undefined): boolean {
  return hasAdminAccess(role) || isDeveloper(role);
}

/**
 * Admin and digital marketer — not developers.
 * Use for: `/dashboard/marketer`, `/dashboard/analytics`, `GET /api/dashboard/analytics`, and ⌘K “Analytics” (same policy).
 */
export function hasMarketerAccess(role: Role | null | undefined): boolean {
  return hasAdminAccess(role) || isMarketer(role);
}

/** Any signed-in back-office role (incl. developers) — e.g. dashboard visit logging, my-activity, search shell. */
export function isDashboardRole(role: Role | null | undefined): boolean {
  return role === 'ADMIN' || role === 'DEVELOPER' || role === 'DIGITAL_MARKETER';
}

/** Who may reset another user’s password via `PATCH /api/users/[id]` (not self; self uses `/api/account/password`). */
export function canSetPasswordForTarget(
  actorRole: Role,
  targetRole: Role
): { ok: true } | { ok: false; message: string } {
  if (!isAdmin(actorRole)) {
    return { ok: false, message: 'Not allowed to change this user password' };
  }
  if (isAdmin(targetRole) || isDeveloper(targetRole) || isMarketer(targetRole)) {
    return { ok: true };
  }
  return { ok: false, message: 'Not a dashboard user' };
}
