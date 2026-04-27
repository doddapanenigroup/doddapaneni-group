'use client';

import { useState, useMemo, useEffect } from 'react';
import { X, Plus, Trash2, Users, KeyRound } from 'lucide-react';
import PasswordInputWithToggle from '@/components/PasswordInputWithToggle';
import type { Role } from '@/lib/constants';
import { getRoleOrder } from '@/lib/constants';
import { getRoleLabel } from '@/lib/dashboard-title';
import {
  dashboardHeaderActionPrimary,
  dashboardHeaderActionSecondary,
  dashboardIconButtonClass,
  dashboardInputClass,
  dashboardInputShellClass,
  dashboardModalBackdropClass,
  dashboardModalFrameClass,
  dashboardListFrameClass,
  dashboardNestedCardClass,
  dashboardNoticeErrorClass,
  dashboardPanelHeaderClass,
} from '@/lib/dashboard-ui';
import { useDashboardShortcuts } from '@/components/dashboard/DashboardShortcutsProvider';

type UserRow = {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  role: Role;
  createdAt: Date;
  createdAtIST: string | null;
  createdAtET: string | null;
};

const roleBadgeClass: Record<string, string> = {
  ADMIN: 'bg-slate-200 text-slate-800',
  DEVELOPER: 'bg-slate-200 text-slate-800',
  DIGITAL_MARKETER: 'bg-slate-200 text-slate-800',
  HR: 'bg-rose-100 text-rose-900 dark:bg-rose-950/50 dark:text-rose-100',
};

export default function ManageEmployeesModal({
  employees,
  allowedRoles,
  creatableRoles,
  currentUserId,
  allowedRolesForPasswordChange,
  onEmployeeCreated,
  onDelete,
  onChangePassword,
  onClose,
  showAddEmployee = true,
  showDelete = true,
  modalTitle = 'Manage employees',
}: {
  employees: UserRow[];
  allowedRoles: Role[];
  /** Roles shown in “Add employee” (must match POST /api/users for this viewer). Defaults to allowedRoles. */
  creatableRoles?: Role[];
  currentUserId: string;
  /** Roles whose password the current user is allowed to change (e.g. Admin: Developer, Digital Marketer) */
  allowedRolesForPasswordChange?: Role[];
  onEmployeeCreated?: (user: UserRow) => void;
  onDelete?: (id: string) => Promise<void>;
  onChangePassword?: (id: string, newPassword: string) => Promise<void>;
  onClose: () => void;
  showAddEmployee?: boolean;
  showDelete?: boolean;
  modalTitle?: string;
}) {
  const { pushEscLayer } = useDashboardShortcuts();
  useEffect(() => {
    return pushEscLayer(() => onClose());
  }, [pushEscLayer, onClose]);

  const sortedAllowedRoles = useMemo(
    () => [...allowedRoles].sort((a, b) => getRoleOrder(a) - getRoleOrder(b)),
    [allowedRoles]
  );
  const sortedCreatableRoles = useMemo(() => {
    const source =
      creatableRoles && creatableRoles.length > 0 ? creatableRoles : allowedRoles;
    return [...source].sort((a, b) => getRoleOrder(a) - getRoleOrder(b));
  }, [creatableRoles, allowedRoles]);
  const canAdd = Boolean(showAddEmployee && onEmployeeCreated && sortedCreatableRoles.length > 0);
  const sortedEmployees = useMemo(
    () =>
      [...employees].sort(
        (a, b) =>
          getRoleOrder(a.role) - getRoleOrder(b.role) ||
          (a.name || a.email).localeCompare(b.name || b.email)
      ),
    [employees]
  );

  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>(() => sortedCreatableRoles[0] ?? allowedRoles[0]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [changePasswordUserId, setChangePasswordUserId] = useState<string | null>(null);
  const [changePasswordValue, setChangePasswordValue] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  function resetAddForm() {
    setMessage('');
    setEmail('');
    setUsername('');
    setPassword('');
    setName('');
    setRole(sortedCreatableRoles[0] ?? allowedRoles[0]);
  }

  async function handleCreateEmployee(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          username: username.trim(),
          password: password.trim(),
          name: name.trim() || undefined,
          role,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        message?: string;
        user?: UserRow;
      };
      if (!res.ok) {
        const msg =
          typeof json.message === 'string'
            ? json.message
            : Array.isArray((json as { errors?: { message?: string }[] }).errors)
              ? String((json as { errors: { message?: string }[] }).errors[0]?.message ?? '')
              : '';
        setMessage(msg || 'Could not create employee.');
        return;
      }
      if (json.user) {
        onEmployeeCreated?.({
          ...json.user,
          createdAt: json.user.createdAt ? new Date(json.user.createdAt as unknown as string) : new Date(),
        });
      }
      setShowForm(false);
      resetAddForm();
    } catch {
      setMessage('Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!onDelete) return;
    if (id === currentUserId) return;
    setMessage('');
    setDeletingId(id);
    try {
      await onDelete(id);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Could not delete this user.');
    }
    setDeletingId(null);
  }

  const canChangePasswordFor = (u: UserRow) =>
    !!onChangePassword &&
    !!allowedRolesForPasswordChange?.length &&
    u.id !== currentUserId &&
    allowedRolesForPasswordChange.includes(u.role);

  async function handleChangePasswordSubmit() {
    if (!changePasswordUserId || !onChangePassword || changePasswordValue.trim().length < 6) return;
    setMessage('');
    setChangePasswordLoading(true);
    try {
      await onChangePassword(changePasswordUserId, changePasswordValue.trim());
      setChangePasswordUserId(null);
      setChangePasswordValue('');
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Failed to update password');
    }
    setChangePasswordLoading(false);
  }

  return (
    <div className={dashboardModalBackdropClass}>
      <div className={`${dashboardModalFrameClass} shadow-2xl`}>
      <div className={`flex shrink-0 items-center justify-between sm:px-6 ${dashboardPanelHeaderClass}`}>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Users size={24} className="text-slate-600" />
          {modalTitle}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className={dashboardIconButtonClass}
          aria-label="Close"
        >
          <X size={24} />
        </button>
      </div>

      <div className="mx-auto w-full max-w-5xl flex-1 space-y-4 overflow-auto p-4 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-slate-600">{sortedEmployees.length} employee(s)</p>
            {canAdd ? (
            <button
              type="button"
              onClick={() => {
                if (showForm) {
                  resetAddForm();
                  setShowForm(false);
                } else {
                  resetAddForm();
                  setShowForm(true);
                }
              }}
              className={`flex items-center gap-2 ${dashboardHeaderActionPrimary}`}
            >
              <Plus size={18} />
              Add employee
            </button>
            ) : null}
          </div>

          {showForm && canAdd && (
            <div className={`space-y-3 p-4 ${dashboardNestedCardClass}`}>
                <form onSubmit={handleCreateEmployee} className="space-y-3">
                  <p className="text-sm text-slate-600">
                    Create a dashboard user with email, username, and password. They can sign in on the same login page.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className={dashboardInputClass}
                        placeholder="employee@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Username <span className="text-slate-400 font-normal">(for sign-in)</span>
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        minLength={2}
                        maxLength={48}
                        pattern="[-A-Za-z0-9._]+"
                        title="Letters, numbers, dots, underscores, hyphens"
                        className={dashboardInputClass}
                        placeholder="e.g. jane.doe"
                        autoComplete="off"
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="manage-new-employee-password" className="block text-sm font-medium text-slate-700 mb-1">
                        Password
                      </label>
                      <PasswordInputWithToggle
                        id="manage-new-employee-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className={dashboardInputShellClass}
                        inputClassName="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 dark:text-slate-100"
                        placeholder="••••••••"
                        autoComplete="new-password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Name (optional)</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={dashboardInputClass}
                        placeholder="Full name"
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as Role)}
                        className={dashboardInputClass}
                      >
                        {sortedCreatableRoles.map((r) => (
                          <option key={r} value={r}>{getRoleLabel(r)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {message ? <p className={dashboardNoticeErrorClass}>{message}</p> : null}
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="submit"
                      disabled={loading}
                      className={`${dashboardHeaderActionPrimary} disabled:opacity-50`}
                    >
                      {loading ? 'Creating…' : 'Create employee'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        resetAddForm();
                      }}
                      className={dashboardHeaderActionSecondary}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
            </div>
          )}

          {changePasswordUserId && (() => {
            const target = sortedEmployees.find((e) => e.id === changePasswordUserId);
            return (
              <div className={`flex flex-wrap items-center gap-3 p-4 ${dashboardNestedCardClass}`}>
                <KeyRound size={20} className="text-slate-600 shrink-0" />
                <span className="text-sm text-slate-700">
                  New password for{' '}
                  <strong>
                    {target?.username
                      ? `${target.username} (${target.email})`
                      : (target?.email ?? changePasswordUserId)}
                  </strong>
                </span>
                <div className="w-full sm:w-52 min-w-[12rem] shrink-0">
                  <PasswordInputWithToggle
                    id={`manage-change-pw-${changePasswordUserId}`}
                    value={changePasswordValue}
                    onChange={(e) => setChangePasswordValue(e.target.value)}
                    placeholder="Min 6 characters"
                    minLength={6}
                    className={dashboardInputShellClass}
                    inputClassName="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 dark:text-slate-100"
                    autoComplete="new-password"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleChangePasswordSubmit}
                  disabled={changePasswordLoading || changePasswordValue.trim().length < 6}
                  className={`${dashboardHeaderActionPrimary} disabled:opacity-50`}
                >
                  {changePasswordLoading ? 'Updating…' : 'Update'}
                </button>
                <button
                  type="button"
                  onClick={() => { setChangePasswordUserId(null); setChangePasswordValue(''); setMessage(''); }}
                  className={dashboardHeaderActionSecondary}
                >
                  Cancel
                </button>
              </div>
            );
          })()}

          <div className={dashboardListFrameClass}>
            <table className="w-full text-sm">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="text-left p-3 font-medium text-slate-700">Email</th>
                  <th className="text-left p-3 font-medium text-slate-700">Username</th>
                  <th className="text-left p-3 font-medium text-slate-700">Name</th>
                  <th className="text-left p-3 font-medium text-slate-700">Role</th>
                  <th className="text-left p-3 font-medium text-slate-700">Created</th>
                  <th className="text-right p-3 font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-slate-500 text-center">
                      No employees yet. Click &quot;Add employee&quot; to create one.
                    </td>
                  </tr>
                ) : (
                  sortedEmployees.map((u) => (
                    <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                      <td className="p-3 text-slate-900">{u.email}</td>
                      <td className="p-3 text-slate-800 font-mono text-xs">{u.username ?? '—'}</td>
                      <td className="p-3 text-slate-600">{u.name ?? '—'}</td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${roleBadgeClass[String(u.role)] ?? 'bg-slate-100 text-slate-700'}`}>
                          {getRoleLabel(u.role)}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 text-xs">
                        {u.createdAtIST && u.createdAtET ? (
                          <span title={u.createdAtET}>
                            {u.createdAtIST}
                            <br />
                            <span className="text-slate-500">{u.createdAtET}</span>
                          </span>
                        ) : u.createdAt ? (
                          new Date(u.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {u.id !== currentUserId ? (
                          <div className="flex items-center justify-end gap-1">
                            {canChangePasswordFor(u) && (
                              <button
                                type="button"
                                onClick={() => { setChangePasswordUserId(u.id); setChangePasswordValue(''); setMessage(''); }}
                                className={`${dashboardIconButtonClass} h-9 w-9 disabled:opacity-50`}
                                title="Change password"
                              >
                                <KeyRound size={18} />
                              </button>
                            )}
                            {showDelete && onDelete && (
                            <button
                              type="button"
                              onClick={() => handleDelete(u.id)}
                              disabled={deletingId === u.id}
                              className={`${dashboardIconButtonClass} h-9 w-9 disabled:opacity-50`}
                              title="Delete employee"
                            >
                              <Trash2 size={18} />
                            </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">(you)</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
      </div>
      </div>
    </div>
  );
}
