'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { publicPathForLocale } from '@/lib/public-path-with-locale';
import { buildAdminRoleDashboardLinks, buildAdminSidebarPrimary } from '@/lib/admin-sidebar-categories';
import { hasAdminAccess } from '@/lib/role-utils';
import type { Role } from '@/lib/constants';
import { useAdminNavOptional } from '@/components/dashboard/AdminNavProvider';

function btnClass(active: boolean) {
  return [
    'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors sm:text-xs',
    active
      ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm dark:border-indigo-500 dark:bg-indigo-500'
      : 'border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
  ].join(' ');
}

function shortLabel(label: string) {
  if (label.length <= 22) return label;
  return `${label.slice(0, 20)}…`;
}

export default function AdminSectionMobileBar({ role }: { role: Role }) {
  const nav = useAdminNavOptional();
  const pathname = usePathname();
  const params = useParams();
  const locale = typeof params?.locale === 'string' ? params.locale : '';
  const adminHome = locale ? publicPathForLocale(locale, '/dashboard/admin') : '';

  const showBar =
    nav && hasAdminAccess(role) && adminHome && (pathname === adminHome || pathname.startsWith(`${adminHome}/`));

  if (!showBar || !nav) return null;

  const primary = buildAdminSidebarPrimary(locale);
  const roleLinks = buildAdminRoleDashboardLinks(locale);

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center gap-1.5 px-4 pb-2 sm:gap-2 sm:px-6 lg:px-8 xl:hidden">
      {primary.map((row) => {
        if (row.type === 'link') {
          const active = pathname === row.path;
          const Icon = row.Icon;
          return (
            <Link
              key={`${row.path}-${row.label}`}
              href={row.path}
              className={btnClass(active)}
              title={row.label}
            >
              <Icon size={13} className="shrink-0 opacity-90" aria-hidden />
              <span className="max-w-[9rem] truncate sm:max-w-none">{shortLabel(row.label)}</span>
            </Link>
          );
        }
        const sectionHref =
          row.sectionId === 'overview' ? adminHome : `${adminHome}?section=${row.sectionId}`;
        const active = pathname === adminHome && nav.section === row.sectionId;
        const Icon = row.Icon;
        return (
          <Link
            key={row.sectionId}
            href={sectionHref}
            className={btnClass(active)}
            title={row.label}
          >
            <Icon size={13} className="shrink-0 opacity-90" aria-hidden />
            <span className="max-w-[9rem] truncate sm:max-w-none">{shortLabel(row.label)}</span>
          </Link>
        );
      })}
      <p className="w-full pt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 uppercase">
        Workspaces
      </p>
      {roleLinks.map((item) => {
        const Icon = item.Icon;
        const active = pathname === item.href;
        return (
          <Link key={item.href} href={item.href} className={btnClass(active)} title={item.label}>
            <Icon size={13} className="shrink-0 opacity-90" aria-hidden />
            <span className="max-w-[9rem] truncate sm:max-w-none">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
