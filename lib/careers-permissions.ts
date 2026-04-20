import type { Role } from '@/lib/constants';
import { hasDeveloperAccess, isMarketer } from '@/lib/role-utils';

/**
 * Careers API: super admin, admin, and developer only.
 * Digital marketers are excluded (use admin accounts for job CMS), even if they can edit “Pages” in the marketer dashboard.
 */
export async function canManageCareers(role: Role | undefined): Promise<boolean> {
  if (!role) return false;
  if (isMarketer(role)) return false;
  if (hasDeveloperAccess(role)) return true;
  return false;
}
