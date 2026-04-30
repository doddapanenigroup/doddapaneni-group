/** In-page sections on `/dashboard/admin` (client state). */
export type AdminMainSection =
  | 'overview'
  | 'careers'
  | 'sector'
  | 'companies'
  | 'active-sessions'
  | 'recent-logins';

export const ADMIN_MAIN_SECTION_IDS: AdminMainSection[] = [
  'overview',
  'careers',
  'sector',
  'companies',
  'active-sessions',
  'recent-logins',
];

export function isAdminMainSection(value: string): value is AdminMainSection {
  return (ADMIN_MAIN_SECTION_IDS as string[]).includes(value);
}
