import type { Role } from '@/lib/constants';
import { hasDeveloperAccess, isMarketer } from '@/lib/role-utils';
import { isModuleAllowedForRole } from '@/lib/module-permissions';

/** Developer, Super Admin, Admin; Digital Marketer only if `pages` module is allowed. */
export async function canManageCareers(role: Role | undefined): Promise<boolean> {
  if (!role) return false;
  if (hasDeveloperAccess(role)) return true;
  if (isMarketer(role)) return isModuleAllowedForRole(role, 'pages');
  return false;
}
