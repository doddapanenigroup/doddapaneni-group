'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Code2, Megaphone, Briefcase } from 'lucide-react';
import type { Role } from '@/lib/constants';
import { getDashboardTitle, HR_DASHBOARD_NAV_LABEL, MARKETING_DASHBOARD_NAV_LABEL } from '@/lib/dashboard-title';
import { hasAdminAccess } from '@/lib/role-utils';
import { publicPathForLocale } from '@/lib/public-path-with-locale';
import { dashboardPanelClass, dashboardPanelHeaderClass } from '@/lib/dashboard-ui';
import AdminSessionsLoginsColumn from '@/components/dashboard/AdminSessionsLoginsColumn';

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
  const items = dashboardItems(locale).filter((item) => item.roles.includes(role));
  const adminBaseHref = publicPathForLocale(locale, '/dashboard/admin');
  const onAdminSection =
    pathname === adminBaseHref || pathname.startsWith(`${adminBaseHref}/`);
  const showAdminSessionsInSidebar = hasAdminAccess(role) && onAdminSection;

  return (
    <aside className="hidden w-[15.5rem] shrink-0 xl:block">
      <div className="sticky top-[76px] flex max-h-[calc(100vh-5.25rem)] flex-col gap-4">
        <div className={`shrink-0 ${dashboardPanelClass}`}>
          <div className={`px-4 py-3 ${dashboardPanelHeaderClass}`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Navigate
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
          </nav>
        </div>
        {showAdminSessionsInSidebar ? (
          <div className="min-h-0 flex-1 overflow-y-auto pr-0.5 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5">
            <AdminSessionsLoginsColumn variant="sidebar" />
          </div>
        ) : null}
      </div>
    </aside>
  );
}
