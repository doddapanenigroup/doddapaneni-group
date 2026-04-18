'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Users, UserCog, UserCircle, Pencil, BarChart3 } from 'lucide-react';
import type { Role } from '@/lib/constants';
import { getRoleOrder } from '@/lib/constants';
import { getDashboardTitle } from '@/lib/dashboard-title';
import VisitStatsLazy from './VisitStatsLazy';
import ManageEmployeesModal from './ManageEmployeesModal';
import AdminOpsInsights from './AdminOpsInsights';
import AdminBackupsPanel from './AdminBackupsPanel';
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

const EMPLOYEE_ROLES_ADMIN: Role[] = ['DEVELOPER', 'DIGITAL_MARKETER'];

export default function AdminDashboard({
  users: initialUsers,
  locale,
  currentUserId,
  viewerRole,
}: {
  users: UserRow[];
  locale: string;
  currentUserId: string;
  viewerRole: Role;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [showManageModal, setShowManageModal] = useState(false);
  const employees = users
    .filter((u) => EMPLOYEE_ROLES_ADMIN.includes(u.role))
    .sort((a, b) => getRoleOrder(a.role) - getRoleOrder(b.role) || (a.name || a.email).localeCompare(b.name || b.email));

  async function handleDeleteEmployee(id: string) {
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.message ?? 'Failed to delete');
    }
    setUsers((prev) => prev.filter((u) => u.id !== id));
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
        title={getDashboardTitle(viewerRole)}
        description="Manage users, view visit statistics, and monitor developer and marketer activity."
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
              href={publicPathForLocale(locale, '/dashboard/analytics')}
              className={dashboardHeaderActionSecondary}
            >
              <BarChart3 size={18} />
              Analytics
            </Link>
          </>
        }
      />

      {showManageModal && (
        <ManageEmployeesModal
          employees={employees}
          allowedRoles={EMPLOYEE_ROLES_ADMIN}
          currentUserId={currentUserId}
          allowedRolesForPasswordChange={['DEVELOPER', 'DIGITAL_MARKETER']}
          onEmployeeCreated={(user) =>
            setUsers((prev) => [{ ...user, createdBy: { email: 'You', name: 'You' } }, ...prev])
          }
          onDelete={handleDeleteEmployee}
          onChangePassword={handleChangePassword}
          onClose={() => setShowManageModal(false)}
        />
      )}

      <CareersJobsPanel locale={locale} />

      <AdminOpsInsights />

      <AdminBackupsPanel />

      <SectorStatusPanel />

      <CompaniesAdminPanel />

      <VisitStatsLazy />
    </div>
  );
}
