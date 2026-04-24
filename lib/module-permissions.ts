import type { Role } from '@/lib/constants';

export const MODULES = ['pages', 'blogs', 'developer_tools'] as const;
export type ModuleName = (typeof MODULES)[number];

/**
 * Legacy module overlay (DB `role_module_permission` removed). All modules allowed.
 */
export async function isModuleAllowedForRole(_role: Role, _module: ModuleName): Promise<boolean> {
  return true;
}
