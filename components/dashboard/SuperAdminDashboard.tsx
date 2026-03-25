'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Shield, UserCog, UserCircle } from 'lucide-react';
import type { Role } from '@/lib/constants';
import { getRoleOrder } from '@/lib/constants';
import VisitStats from './VisitStats';
import ManageEmployeesModal from './ManageEmployeesModal';
import AdminOpsInsights from './AdminOpsInsights';

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

const EMPLOYEE_ROLES_SUPER_ADMIN: Role[] = ['ADMIN', 'DEVELOPER', 'DIGITAL_MARKETER'];

export default function SuperAdminDashboard({
  users: initialUsers,
  locale,
  currentUserId,
}: {
  users: UserRow[];
  locale: string;
  currentUserId: string;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [showManageModal, setShowManageModal] = useState(false);
  const employees = users
    .filter((u) => EMPLOYEE_ROLES_SUPER_ADMIN.includes(u.role))
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
      <header className="rounded-2xl bg-slate-800 text-white p-6 shadow-xl border border-slate-600">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield size={28} className="opacity-90" />
              Super Admin Dashboard
            </h1>
            <p className="mt-1 opacity-90 text-sm">Manage users, view visit statistics, and monitor login activity.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowManageModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors"
            >
              <UserCog size={18} />
              Manage employees
            </button>
            <Link
              href={`/${locale}/dashboard/employees`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors"
            >
              <UserCircle size={18} />
              Employees
            </Link>
          </div>
        </div>
      </header>

      {showManageModal && (
        <ManageEmployeesModal
          employees={employees}
          allowedRoles={EMPLOYEE_ROLES_SUPER_ADMIN}
          currentUserId={currentUserId}
          allowedRolesForPasswordChange={['ADMIN', 'DEVELOPER', 'DIGITAL_MARKETER']}
          onEmployeeCreated={(user) =>
            setUsers((prev) => [{ ...user, createdBy: { email: 'You', name: 'You' } }, ...prev])
          }
          onDelete={handleDeleteEmployee}
          onChangePassword={handleChangePassword}
          onClose={() => setShowManageModal(false)}
        />
      )}

      <AdminOpsInsights />

      <VisitStats />
    </div>
  );
}
