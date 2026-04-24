'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, UserCog, UserCircle, Pencil, Contact } from 'lucide-react';
import type { Role } from '@/lib/constants';
import { getRoleOrder } from '@/lib/constants';
import { getDashboardTitle } from '@/lib/dashboard-title';
import ManageEmployeesModal from './ManageEmployeesModal';
import AdminOpsInsights from './AdminOpsInsights';
import AdminSessionsLoginsColumn from './AdminSessionsLoginsColumn';
import SectorStatusPanel from './SectorStatusPanel';
import CompaniesAdminPanel from './CompaniesAdminPanel';
import DashboardPageHeader from './DashboardPageHeader';
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

const EMPLOYEE_ROLES: Role[] = ['ADMIN', 'DEVELOPER', 'DIGITAL_MARKETER'];

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

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);
  const employeeRoles = EMPLOYEE_ROLES;
  const creatableRoles: Role[] = ['ADMIN', 'DEVELOPER', 'DIGITAL_MARKETER'];
  const allowedRolesForPasswordChange: Role[] = ['ADMIN', 'DEVELOPER', 'DIGITAL_MARKETER'];

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
      <DashboardPageHeader
        icon={Users}
        title={getDashboardTitle('ADMIN')}
        description="Manage users, sector visibility, companies, and monitor developer and marketer activity."
        actions={
          <>
            <button type="button" onClick={() => setShowManageModal(true)} className={dashboardHeaderActionPrimary}>
              <UserCog size={18} />
              Manage employees
            </button>
            <Link
              href={publicPathForLocale(locale, '/dashboard/employees')}
              className={dashboardHeaderActionSecondary}
            >
              <UserCircle size={18} />
              Employees
            </Link>
            <Link
              href={publicPathForLocale(locale, '/dashboard/marketer')}
              className={dashboardHeaderActionSecondary}
            >
              <Pencil size={18} />
              Blogs &amp; SEO
            </Link>
            <Link
              href={publicPathForLocale(locale, '/dashboard/admin/team')}
              className={dashboardHeaderActionSecondary}
            >
              <Contact size={18} />
              Public team roster
            </Link>
          </>
        }
      />

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
