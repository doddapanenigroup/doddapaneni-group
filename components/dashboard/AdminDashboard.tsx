'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserCog, UserCircle, Pencil, Contact, Briefcase } from 'lucide-react';
import type { Role } from '@/lib/constants';
import { getRoleOrder } from '@/lib/constants';
import ManageEmployeesModal from './ManageEmployeesModal';
import AdminSessionsLoginsColumn from './AdminSessionsLoginsColumn';
import SectorStatusPanel from './SectorStatusPanel';
import CompaniesAdminPanel from './CompaniesAdminPanel';
import CareersJobsPanel from './CareersJobsPanel';
import { useAdminNav } from './AdminNavProvider';
import { isAdminMainSection } from '@/lib/admin-dashboard-nav';
import {
  dashboardHeaderActionPrimary,
  dashboardHeaderActionSecondary,
  dashboardHeroClass,
  dashboardMainMaxClass,
  dashboardPanelHeaderClass,
  dashboardStageClass,
  dashboardToolbarStripClass,
} from '@/lib/dashboard-ui';
import { publicPathForLocale } from '@/lib/public-path-with-locale';

type UserRow = {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  role: Role;
  createdAt: Date;
  createdAtIST: string | null;
  createdAtET: string | null;
  createdBy?: { email: string; name: string | null } | null;
};

const EMPLOYEE_ROLES: Role[] = ['ADMIN', 'DEVELOPER', 'DIGITAL_MARKETER', 'HR'];

function AdminOverviewPanel() {
  return (
    <div className={dashboardHeroClass}>
      <div className={dashboardPanelHeaderClass}>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Admin overview</h2>
      </div>
      <div className="space-y-3 px-5 py-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        <p>
          Manage internal accounts from the toolbar above, and use{' '}
          <span className="font-medium text-slate-700 dark:text-slate-300">Navigate</span> in the sidebar for
          careers, sector visibility, companies, and session tools. Developer and marketer activity logs have
          their own pages (50 entries per page with pagination).
        </p>
      </div>
    </div>
  );
}

export default function AdminDashboard({
  users: initialUsers,
  locale,
  currentUserId,
}: {
  users: UserRow[];
  locale: string;
  currentUserId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { section, setSection } = useAdminNav();
  const [users, setUsers] = useState(initialUsers);
  const [showManageModal, setShowManageModal] = useState(false);
  const [manageModalLoading, setManageModalLoading] = useState(false);

  /**
   * When the modal is open, do not copy `initialUsers` from the server shell — a `router.refresh()` can
   * deliver a new array reference with RSC-cached rows and overwrite a fresh `GET /api/users` list.
   */
  useEffect(() => {
    if (showManageModal) return;
    setUsers(initialUsers);
  }, [initialUsers, showManageModal]);

  useEffect(() => {
    const raw = searchParams.get('section');
    if (raw && isAdminMainSection(raw)) {
      setSection(raw);
    } else if (!raw) {
      setSection('overview');
    }
  }, [searchParams, setSection]);

  async function openManageEmployeesModal() {
    setManageModalLoading(true);
    try {
      const res = await fetch(`/api/users?_=${Date.now()}`, {
        cache: 'no-store',
        credentials: 'include',
      });
      if (res.ok) {
        const json = (await res.json()) as { users?: UserRow[] };
        if (Array.isArray(json.users)) {
          setUsers(
            json.users.map((u) => ({
              ...u,
              createdAt:
                u.createdAt instanceof Date ? u.createdAt : new Date(String(u.createdAt)),
            })),
          );
        }
      } else {
        console.warn('[AdminDashboard] GET /api/users failed:', res.status);
      }
    } catch (e) {
      console.warn('[AdminDashboard] GET /api/users error:', e);
    } finally {
      setManageModalLoading(false);
      setShowManageModal(true);
    }
  }
  const employeeRoles = EMPLOYEE_ROLES;
  const creatableRoles: Role[] = ['ADMIN', 'DEVELOPER', 'DIGITAL_MARKETER', 'HR'];
  const allowedRolesForPasswordChange: Role[] = ['ADMIN', 'DEVELOPER', 'DIGITAL_MARKETER', 'HR'];

  const employees = users
    .filter((u) => employeeRoles.includes(u.role))
    .sort((a, b) => getRoleOrder(a.role) - getRoleOrder(b.role) || (a.name || a.email).localeCompare(b.name || b.email));

  async function handleDeleteEmployee(id: string) {
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    const json = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) {
      throw new Error(typeof json.message === 'string' ? json.message : 'Failed to delete');
    }
    setUsers((prev) => prev.filter((u) => u.id !== id));
    router.refresh();
  }

  async function handleChangePassword(id: string, newPassword: string) {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message ?? 'Failed to update password');
  }

  let main: React.ReactNode;
  switch (section) {
    case 'careers':
      main = <CareersJobsPanel locale={locale} />;
      break;
    case 'sector':
      main = <SectorStatusPanel />;
      break;
    case 'companies':
      main = <CompaniesAdminPanel />;
      break;
    case 'active-sessions':
      main = <AdminSessionsLoginsColumn view="sessions" />;
      break;
    case 'recent-logins':
      main = <AdminSessionsLoginsColumn view="logins" />;
      break;
    case 'overview':
    default:
      main = <AdminOverviewPanel />;
      break;
  }

  return (
    <div className={`${dashboardMainMaxClass} space-y-6`}>
      <div className={`${dashboardToolbarStripClass} justify-end xl:sticky xl:top-[4.5rem] xl:z-10`}>
        <button
          type="button"
          disabled={manageModalLoading}
          onClick={() => void openManageEmployeesModal()}
          className={`${dashboardHeaderActionPrimary} disabled:pointer-events-none disabled:opacity-55`}
        >
          <UserCog size={18} />
          {manageModalLoading ? 'Loading…' : 'Manage employees'}
        </button>
        <Link href={publicPathForLocale(locale, '/dashboard/employees')} className={dashboardHeaderActionSecondary}>
          <UserCircle size={18} />
          Employees
        </Link>
        <Link href={publicPathForLocale(locale, '/dashboard/marketer')} className={dashboardHeaderActionSecondary}>
          <Pencil size={18} />
          Blogs &amp; SEO
        </Link>
        <Link href={publicPathForLocale(locale, '/dashboard/admin/team')} className={dashboardHeaderActionSecondary}>
          <Contact size={18} />
          Public team roster
        </Link>
        <Link href={publicPathForLocale(locale, '/dashboard/hr')} className={dashboardHeaderActionSecondary}>
          <Briefcase size={18} />
          Career applications
        </Link>
      </div>

      {showManageModal && (
        <ManageEmployeesModal
          employees={employees}
          allowedRoles={employeeRoles}
          creatableRoles={creatableRoles}
          currentUserId={currentUserId}
          allowedRolesForPasswordChange={allowedRolesForPasswordChange}
          onEmployeeCreated={(user) => {
            setUsers((prev) => [{ ...user, createdBy: { email: 'You', name: 'You' } }, ...prev]);
            router.refresh();
          }}
          onDelete={handleDeleteEmployee}
          onChangePassword={handleChangePassword}
          onClose={() => setShowManageModal(false)}
        />
      )}

      <div className={dashboardStageClass}>{main}</div>
    </div>
  );
}
