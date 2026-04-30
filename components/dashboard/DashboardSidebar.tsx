'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Code2,
  Megaphone,
  Briefcase,
  History,
  BookOpen,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import type { Role } from '@/lib/constants';
import { getDashboardTitle, HR_DASHBOARD_NAV_LABEL, MARKETING_DASHBOARD_NAV_LABEL } from '@/lib/dashboard-title';
import {
  hasAdminAccess,
  hasDeveloperAccess,
  hasMarketerAccess,
  isMarketer,
} from '@/lib/role-utils';
import { useAdminNavOptional } from '@/components/dashboard/AdminNavProvider';
import { buildAdminRoleDashboardLinks, buildAdminSidebarPrimary } from '@/lib/admin-sidebar-categories';
import { publicPathForLocale } from '@/lib/public-path-with-locale';
import { dashboardPanelClass, dashboardPanelHeaderClass } from '@/lib/dashboard-ui';
import { DashboardSidebarBelowSlot } from '@/components/dashboard/DashboardSidebarBelowProvider';
import { useDashboardActivitySheetOptional } from '@/components/dashboard/DashboardActivitySheetProvider';
import { useMarketerNavOptional } from '@/components/dashboard/MarketerNavProvider';

type DashboardMenuItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  roles: Role[];
};

function dashboardItems(locale: string): DashboardMenuItem[] {
  return [
    {
      href: publicPathForLocale(locale, '/dashboard/admin'),
      label: getDashboardTitle('ADMIN'),
      icon: Users,
      roles: ['ADMIN'],
    },
    {
      href: publicPathForLocale(locale, '/dashboard/developer'),
      label: getDashboardTitle('DEVELOPER'),
      icon: Code2,
      roles: ['ADMIN', 'DEVELOPER'],
    },
    {
      href: publicPathForLocale(locale, '/dashboard/marketer'),
      label: MARKETING_DASHBOARD_NAV_LABEL,
      icon: Megaphone,
      roles: ['ADMIN', 'DIGITAL_MARKETER'],
    },
    {
      href: publicPathForLocale(locale, '/dashboard/hr'),
      label: HR_DASHBOARD_NAV_LABEL,
      icon: Briefcase,
      roles: ['ADMIN', 'HR'],
    },
  ];
}

export default function DashboardSidebar({
  locale,
  role,
}: {
  locale: string;
  role: Role;
}) {
  const pathname = usePathname();
  const adminBaseHref = publicPathForLocale(locale, '/dashboard/admin');
  /** Admins open Developer / Marketer / HR only via Workspaces (avoid duplicate top-row dashboard links). */
  const items = dashboardItems(locale)
    .filter((item) => item.roles.includes(role))
    .filter((item) => {
      if (role !== 'ADMIN') return true;
      return item.href === adminBaseHref;
    });
  const onAdminMainDashboard = pathname === adminBaseHref;
  const adminNav = useAdminNavOptional();
  const showAdminSectionNav =
    hasAdminAccess(role) &&
    adminNav != null &&
    (pathname === adminBaseHref || pathname.startsWith(`${adminBaseHref}/`));
  const activitySheet = useDashboardActivitySheetOptional();
  const showRecentActivity =
    activitySheet != null && (hasDeveloperAccess(role) || isMarketer(role));
  const showMarketingActivity = activitySheet != null && hasMarketerAccess(role);
  const marketerNav = useMarketerNavOptional();
  const marketerBaseHref = publicPathForLocale(locale, '/dashboard/marketer');
  const onMarketerDashboard =
    pathname === marketerBaseHref || pathname.startsWith(`${marketerBaseHref}/`);
  const showMarketerSectionNav =
    onMarketerDashboard && marketerNav != null && (marketerNav.caps.canBlogs || marketerNav.caps.canPages);

  function marketerNavBtnClass(active: boolean) {
    return [
      'mt-0.5 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-semibold transition-all duration-150',
      active
        ? 'bg-indigo-600 text-white shadow-sm dark:bg-indigo-500'
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
    ].join(' ');
  }

  function adminNavBtnClass(active: boolean) {
    return marketerNavBtnClass(active);
  }

  const adminPrimaryItems = showAdminSectionNav ? buildAdminSidebarPrimary(locale) : [];
  const adminRoleLinks = showAdminSectionNav ? buildAdminRoleDashboardLinks(locale) : [];

  return (
    <aside className="hidden w-[15.5rem] shrink-0 xl:block">
      <div className="sticky top-[76px] flex max-h-[calc(100vh-5.25rem)] min-h-0 flex-col gap-4 overflow-y-auto [scrollbar-width:thin] pr-0.5 [-ms-overflow-style:none] [&::-webkit-scrollbar]:w-1.5">
        <div className={`shrink-0 ${dashboardPanelClass}`}>
          <div className={`px-4 py-3 ${dashboardPanelHeaderClass}`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              {showAdminSectionNav ? 'Admin dashboard' : 'Navigate'}
            </p>
          </div>
          <nav className="space-y-1 p-2.5">
            {items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150',
                    active
                      ? 'bg-indigo-600 text-white shadow-sm dark:bg-indigo-500'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
                  ].join(' ')}
                >
                  <Icon size={18} className={`shrink-0 ${active ? 'text-white' : 'opacity-90'}`} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
            <Link
              href={publicPathForLocale(locale, '/dashboard')}
              className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <LayoutDashboard size={16} className="shrink-0 opacity-80" />
              Dashboard home
            </Link>
            {showAdminSectionNav ? (
              <>
                <div
                  className="mx-2 my-2 border-t border-slate-200 dark:border-slate-700"
                  role="separator"
                  aria-hidden
                />
                {adminPrimaryItems.map((row) => {
                  if (row.type === 'link') {
                    const active = pathname === row.path;
                    const Icon = row.Icon;
                    return (
                      <Link
                        key={`${row.path}-${row.label}`}
                        href={row.path}
                        title={row.label}
                        className={adminNavBtnClass(active)}
                      >
                        <Icon size={16} className={`shrink-0 ${active ? 'text-white' : 'opacity-80'}`} aria-hidden />
                        <span className="break-words text-left leading-snug">{row.label}</span>
                      </Link>
                    );
                  }
                  const sectionHref =
                    row.sectionId === 'overview'
                      ? adminBaseHref
                      : `${adminBaseHref}?section=${row.sectionId}`;
                  const active = onAdminMainDashboard && adminNav!.section === row.sectionId;
                  const Icon = row.Icon;
                  return (
                    <Link
                      key={row.sectionId}
                      href={sectionHref}
                      title={row.label}
                      className={adminNavBtnClass(active)}
                    >
                      <Icon size={16} className={`shrink-0 ${active ? 'text-white' : 'opacity-80'}`} aria-hidden />
                      <span className="break-words text-left leading-snug">{row.label}</span>
                    </Link>
                  );
                })}
                <p className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 uppercase">
                  Workspaces
                </p>
                {adminRoleLinks.map((item) => {
                  const Icon = item.Icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={`workspaces-${item.href}`}
                      href={item.href}
                      className={adminNavBtnClass(active)}
                      title={item.label}
                    >
                      <Icon size={16} className={`shrink-0 ${active ? 'text-white' : 'opacity-80'}`} aria-hidden />
                      <span className="break-words text-left leading-snug">{item.label}</span>
                    </Link>
                  );
                })}
              </>
            ) : null}
            {showMarketerSectionNav && marketerNav.caps.canBlogs ? (
              <button
                type="button"
                onClick={() => marketerNav.setSection('blogs')}
                className={marketerNavBtnClass(marketerNav.section === 'blogs')}
              >
                <BookOpen size={16} className={`shrink-0 ${marketerNav.section === 'blogs' ? 'text-white' : 'opacity-80'}`} aria-hidden />
                Blogs
              </button>
            ) : null}
            {showMarketerSectionNav && (marketerNav.caps.canBlogs || marketerNav.caps.canPages) ? (
              <button
                type="button"
                onClick={() => marketerNav.setSection('media')}
                className={marketerNavBtnClass(marketerNav.section === 'media')}
              >
                <ImageIcon size={16} className={`shrink-0 ${marketerNav.section === 'media' ? 'text-white' : 'opacity-80'}`} aria-hidden />
                Media library
              </button>
            ) : null}
            {showMarketerSectionNav && marketerNav.caps.canPages ? (
              <button
                type="button"
                onClick={() => marketerNav.setSection('pages')}
                className={marketerNavBtnClass(marketerNav.section === 'pages')}
              >
                <FileText size={16} className={`shrink-0 ${marketerNav.section === 'pages' ? 'text-white' : 'opacity-80'}`} aria-hidden />
                Pages
              </button>
            ) : null}
            {showRecentActivity ? (
              <button
                type="button"
                onClick={() => activitySheet.openActivitySheet('recent')}
                className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                <History size={16} className="shrink-0 opacity-80" aria-hidden />
                Recent activity
              </button>
            ) : null}
            {showMarketingActivity ? (
              <button
                type="button"
                onClick={() => activitySheet.openActivitySheet('marketing')}
                className="mt-0.5 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                <Megaphone size={16} className="shrink-0 opacity-80" aria-hidden />
                Marketing &amp; SEO activity
              </button>
            ) : null}
          </nav>
        </div>
        <DashboardSidebarBelowSlot />
      </div>
    </aside>
  );
}
