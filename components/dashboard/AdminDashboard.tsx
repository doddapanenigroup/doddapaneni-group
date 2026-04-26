'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserCog, UserCircle, Pencil, Contact, Briefcase } from 'lucide-react';
import type { Role } from '@/lib/constants';
import { getRoleOrder } from '@/lib/constants';
import ManageEmployeesModal from './ManageEmployeesModal';
import AdminOpsInsights from './AdminOpsInsights';
import AdminSessionsLoginsColumn from './AdminSessionsLoginsColumn';
import SectorStatusPanel from './SectorStatusPanel';
import CompaniesAdminPanel from './CompaniesAdminPanel';
import CareersJobsPanel from './CareersJobsPanel';
import { dashboardHeaderActionPrimary, dashboardHeaderActionSecondary } from '@/lib/dashboard-ui';
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

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-2 md:justify-end">
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

      <div className="space-y-8 xl:hidden">
        <AdminSessionsLoginsColumn />
      </div>

      <CareersJobsPanel locale={locale} />

      <AdminOpsInsights />

      <SectorStatusPanel />

      <CompaniesAdminPanel />
    </div>
  );
}
