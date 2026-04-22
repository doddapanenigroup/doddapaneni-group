'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Code2, Megaphone } from 'lucide-react';
import type { Role } from '@/lib/constants';
import { getDashboardTitle, MARKETING_DASHBOARD_NAV_LABEL } from '@/lib/dashboard-title';
import { hasAdminAccess } from '@/lib/role-utils';
import { publicPathForLocale } from '@/lib/public-path-with-locale';
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
      roles: ['SUPER_ADMIN', 'ADMIN'],
    },
    {
      href: publicPathForLocale(locale, '/dashboard/developer'),
      label: getDashboardTitle('DEVELOPER'),
      icon: Code2,
      roles: ['SUPER_ADMIN', 'ADMIN', 'DEVELOPER'],
    },
    {
      href: publicPathForLocale(locale, '/dashboard/marketer'),
      label: MARKETING_DASHBOARD_NAV_LABEL,
      icon: Megaphone,
      roles: ['SUPER_ADMIN', 'ADMIN', 'DIGITAL_MARKETER'],
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
    <aside className="hidden w-64 shrink-0 xl:block">
      <div className="sticky top-[78px] flex max-h-[calc(100vh-5.5rem)] flex-col gap-4">
        <div className="shrink-0 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)] dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/20">
          <div className="border-b border-slate-100/90 px-4 py-3 dark:border-slate-800">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              Navigate
            </p>
          </div>
          <nav className="space-y-0.5 p-2">
            {items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-slate-900 text-white shadow-sm dark:bg-blue-600 dark:text-white'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/80',
                  ].join(' ')}
                >
                  <Icon size={18} className="shrink-0 opacity-90" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
            <Link
              href={publicPathForLocale(locale, '/dashboard')}
              className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
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
