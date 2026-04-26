export const ROLES = ['ADMIN', 'DEVELOPER', 'DIGITAL_MARKETER', 'HR'] as const;
export type Role = (typeof ROLES)[number];

/** Display order in every dashboard: Admin, Developer, Digital Marketer, HR */
export const ROLE_DISPLAY_ORDER: readonly Role[] = ROLES;

export function getRoleOrder(role: Role): number {
  const i = ROLES.indexOf(role);
  return i === -1 ? 999 : i;
}
