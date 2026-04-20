import type { Role } from '@/lib/constants';
import { hasDeveloperAccess, isMarketer } from '@/lib/role-utils';

/** Developer, Super Admin, Admin. Digital marketers are blogs-only (no careers CMS). */
export async function canManageCareers(role: Role | undefined): Promise<boolean> {
  if (!role) return false;
  if (isMarketer(role)) return false;
  if (hasDeveloperAccess(role)) return true;
  return false;
}
