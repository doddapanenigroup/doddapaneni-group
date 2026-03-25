'use client';

import { useState, useMemo } from 'react';
import { X, Plus, Trash2, Users, KeyRound } from 'lucide-react';
import PasswordInputWithToggle from '@/components/PasswordInputWithToggle';
import type { Role } from '@/lib/constants';
import { getRoleOrder } from '@/lib/constants';

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

const roleLabel: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  DEVELOPER: 'Developer',
  DIGITAL_MARKETER: 'Digital Marketer',
};

const roleBadgeClass: Record<string, string> = {
  SUPER_ADMIN: 'bg-slate-200 text-slate-800',
  ADMIN: 'bg-slate-200 text-slate-800',
  DEVELOPER: 'bg-slate-200 text-slate-800',
  DIGITAL_MARKETER: 'bg-slate-200 text-slate-800',
};

export default function ManageEmployeesModal({
  employees,
  allowedRoles,
  currentUserId,
  allowedRolesForPasswordChange,
  onEmployeeCreated,
  onDelete,
  onChangePassword,
  onClose,
}: {
  employees: UserRow[];
  allowedRoles: Role[];
  currentUserId: string;
  /** Roles whose password the current user is allowed to change (e.g. Admin: Developer, Digital Marketer) */
  allowedRolesForPasswordChange?: Role[];
  /** Called after employee is created (OTP verified). */
  onEmployeeCreated: (user: UserRow) => void;
  onDelete: (id: string) => Promise<void>;
  onChangePassword?: (id: string, newPassword: string) => Promise<void>;
  onClose: () => void;
}) {
  const sortedAllowedRoles = useMemo(
    () => [...allowedRoles].sort((a, b) => getRoleOrder(a) - getRoleOrder(b)),
    [allowedRoles]
  );
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
  const [role, setRole] = useState<Role>(() => sortedAllowedRoles[0] ?? allowedRoles[0]);
  const [message, setMessage] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [createStep, setCreateStep] = useState<'details' | 'otp'>('details');
  const [createOtp, setCreateOtp] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [changePasswordUserId, setChangePasswordUserId] = useState<string | null>(null);
  const [changePasswordValue, setChangePasswordValue] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  function resetAddForm() {
    setCreateStep('details');
    setCreateOtp('');
    setInfo('');
    setMessage('');
    setEmail('');
    setUsername('');
    setPassword('');
    setName('');
    setRole(sortedAllowedRoles[0]);
  }

  async function handleSendCreateOtp(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    setInfo('');
    setLoading(true);
    try {
      const res = await fetch('/api/users/create-employee-otp', {
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
      const json = (await res.json().catch(() => ({}))) as { message?: string; codeSentTo?: string };
      if (!res.ok) {
        setMessage(typeof json.message === 'string' ? json.message : 'Could not send verification code.');
        return;
      }
      setCreateStep('otp');
      setCreateOtp('');
      const dest = json.codeSentTo ?? 'your email';
      setInfo(`Enter the 6-digit code sent to ${dest} to create this employee.`);
    } catch {
      setMessage('Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateEmployeeWithOtp(e: React.FormEvent) {
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
          createOtp: createOtp.replace(/\s/g, ''),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        message?: string;
        user?: UserRow;
      };
      if (!res.ok) {
        setMessage(typeof json.message === 'string' ? json.message : 'Could not create employee.');
        return;
      }
      if (json.user) {
        onEmployeeCreated({
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
    if (id === currentUserId) return;
    setDeletingId(id);
    try {
      await onDelete(id);
    } catch {
      // ignore
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
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 bg-slate-50 shrink-0">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Users size={24} className="text-slate-600" />
          Manage employees
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Close"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-slate-600">{sortedEmployees.length} employee(s)</p>
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
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 text-white text-sm font-medium hover:bg-slate-800 shadow-md transition-colors"
            >
              <Plus size={18} />
              Add employee
            </button>
          </div>

          {showForm && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              {createStep === 'details' ? (
                <form onSubmit={handleSendCreateOtp} className="space-y-3">
                  <p className="text-sm text-slate-600">
                    We email a one-time code to <strong>your</strong> account email. Enter it on the next step to
                    create the employee.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 text-sm"
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
                        pattern="[a-zA-Z0-9._-]+"
                        title="Letters, numbers, dots, underscores, hyphens"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 text-sm"
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
                        className="flex w-full min-w-0 items-center rounded-lg border border-slate-300 bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
                        inputClassName="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-sm text-slate-900 outline-none ring-0"
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
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 text-sm"
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
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 text-sm"
                      >
                        {sortedAllowedRoles.map((r) => (
                          <option key={r} value={r}>{roleLabel[r] ?? r}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {message && <p className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg">{message}</p>}
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 rounded-lg bg-slate-700 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
                    >
                      {loading ? 'Sending…' : 'Send verification code'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        resetAddForm();
                      }}
                      className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleCreateEmployeeWithOtp} className="space-y-3">
                  {info && <p className="text-sm text-slate-700 bg-slate-100 px-3 py-2 rounded-lg">{info}</p>}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Verification code</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={createOtp}
                      onChange={(e) => setCreateOtp(e.target.value)}
                      required
                      minLength={6}
                      maxLength={12}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 text-sm tracking-widest text-center text-lg max-w-xs"
                      placeholder="000000"
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    New account: {email.trim().toLowerCase()} · @{username.trim().toLowerCase()} ·{' '}
                    {roleLabel[role] ?? role}
                  </p>
                  {message && <p className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg">{message}</p>}
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="submit"
                      disabled={loading || createOtp.replace(/\s/g, '').length < 6}
                      className="px-4 py-2 rounded-lg bg-slate-700 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
                    >
                      {loading ? 'Creating…' : 'Create employee'}
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        setCreateStep('details');
                        setCreateOtp('');
                        setInfo('');
                        setMessage('');
                      }}
                      className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm"
                    >
                      Back
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {changePasswordUserId && (() => {
            const target = sortedEmployees.find((e) => e.id === changePasswordUserId);
            return (
              <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3">
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
                    className="flex w-full min-w-0 items-center rounded-lg border border-slate-300 bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
                    inputClassName="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-sm text-slate-900 outline-none ring-0"
                    autoComplete="new-password"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleChangePasswordSubmit}
                  disabled={changePasswordLoading || changePasswordValue.trim().length < 6}
                  className="px-3 py-2 rounded-lg bg-slate-700 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
                >
                  {changePasswordLoading ? 'Updating…' : 'Update'}
                </button>
                <button
                  type="button"
                  onClick={() => { setChangePasswordUserId(null); setChangePasswordValue(''); setMessage(''); }}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm"
                >
                  Cancel
                </button>
              </div>
            );
          })()}

          <div className="border border-slate-200 rounded-xl overflow-hidden">
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
                          {roleLabel[String(u.role)] ?? String(u.role)}
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
                                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                                title="Change password"
                              >
                                <KeyRound size={18} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDelete(u.id)}
                              disabled={deletingId === u.id}
                              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                              title="Delete employee"
                            >
                              <Trash2 size={18} />
                            </button>
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
  );
}
