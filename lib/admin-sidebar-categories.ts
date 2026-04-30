import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Briefcase,
  Building2,
  Code2,
  Eye,
  Image as ImageIcon,
  KeyRound,
  LayoutDashboard,
  LogIn,
  Mail,
  Megaphone,
  UserCircle,
  Users,
} from 'lucide-react';
import type { AdminMainSection } from '@/lib/admin-dashboard-nav';
import { publicPathForLocale } from '@/lib/public-path-with-locale';

export type AdminPrimaryNavItem =
  | { type: 'section'; sectionId: AdminMainSection; label: string; Icon: LucideIcon }
  | { type: 'link'; path: string; label: string; Icon: LucideIcon };

/** Main admin tools (order matches dashboard filter card). */
export function buildAdminSidebarPrimary(locale: string): AdminPrimaryNavItem[] {
  const p = (path: string) => publicPathForLocale(locale, path);
  return [
    { type: 'section', sectionId: 'overview', label: 'Overview', Icon: LayoutDashboard },
    { type: 'section', sectionId: 'careers', label: 'Careers', Icon: Briefcase },
    { type: 'link', path: p('/contact'), label: 'Contact', Icon: Mail },
    { type: 'section', sectionId: 'active-sessions', label: 'Dashboard sessions', Icon: Activity },
    { type: 'link', path: p('/dashboard/marketer'), label: 'Media', Icon: ImageIcon },
    { type: 'link', path: p('/dashboard/security'), label: 'Password', Icon: KeyRound },
    { type: 'link', path: p('/dashboard/admin/team'), label: 'Team', Icon: Users },
    { type: 'link', path: p('/dashboard/employees'), label: 'Users', Icon: UserCircle },
    { type: 'section', sectionId: 'sector', label: 'Sector visibility', Icon: Eye },
    { type: 'section', sectionId: 'companies', label: 'Companies', Icon: Building2 },
    {
      type: 'link',
      path: p('/dashboard/admin/developer-edits'),
      label: 'Developer edits (files & CMS)',
      Icon: Code2,
    },
    {
      type: 'link',
      path: p('/dashboard/admin/marketer-seo'),
      label: 'Digital marketer / SEO',
      Icon: Megaphone,
    },
    { type: 'section', sectionId: 'recent-logins', label: 'Recent logins', Icon: LogIn },
  ];
}

export type AdminRoleDashboardLink = { href: string; label: string; Icon: LucideIcon };

/** Developer / Digital marketing / HR dashboard entry points (Workspaces in the admin sidebar). */
export function buildAdminRoleDashboardLinks(locale: string): AdminRoleDashboardLink[] {
  const p = (path: string) => publicPathForLocale(locale, path);
  return [
    { href: p('/dashboard/developer'), label: 'Developer', Icon: Code2 },
    { href: p('/dashboard/marketer'), label: 'Digital marketing', Icon: Megaphone },
    { href: p('/dashboard/hr'), label: 'HR', Icon: Briefcase },
  ];
}
