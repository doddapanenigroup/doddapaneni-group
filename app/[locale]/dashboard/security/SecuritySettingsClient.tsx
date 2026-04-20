'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Shield, KeyRound } from 'lucide-react';
import PasswordInputWithToggle from '@/components/PasswordInputWithToggle';
import { publicPathForLocale } from '@/lib/public-path-with-locale';

export default function SecuritySettingsClient({ locale }: { locale: string }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const backHref = publicPathForLocale(locale, '/dashboard');

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg('');
    setPwLoading(true);
    try {
      const res = await fetch('/api/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: currentPassword,
          newPassword: newPassword,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPwMsg(typeof json.message === 'string' ? json.message : 'Could not update password');
        return;
      }
      setPwMsg('Password updated.');
      setCurrentPassword('');
      setNewPassword('');
    } catch {
      setPwMsg('Something went wrong.');
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <div className="space-y-8 max-w-lg">
      <div className="flex items-center gap-4">
        <Link
          href={backHref}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium"
        >
          <ArrowLeft size={18} />
          Back to dashboard
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Shield size={26} className="text-slate-600" />
          Security
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          <strong>Passwords only</strong> — no email, no verification codes. Enter your <strong>current</strong>{' '}
          password, then a new one. The new password is stored as a bcrypt hash. Sign in with your email or username. To
          change another user&apos;s password, admins use <strong>Manage employees</strong> on the admin dashboard. After
          you change your password here, you stay signed in; if an admin resets your account, you must sign in again.
        </p>
      </div>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <KeyRound size={20} />
          Change password
        </h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-3">
          <div>
            <label htmlFor="security-current-password" className="block text-sm font-medium text-slate-700 mb-1">
              Current password
            </label>
            <PasswordInputWithToggle
              id="security-current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="flex w-full min-w-0 items-center rounded-lg border border-slate-300 bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
              inputClassName="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-slate-900 outline-none ring-0"
              autoComplete="current-password"
            />
          </div>
          <div>
            <label htmlFor="security-new-password" className="block text-sm font-medium text-slate-700 mb-1">
              New password (min 6)
            </label>
            <PasswordInputWithToggle
              id="security-new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="flex w-full min-w-0 items-center rounded-lg border border-slate-300 bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
              inputClassName="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-slate-900 outline-none ring-0"
              autoComplete="new-password"
            />
          </div>
          {pwMsg && (
            <p className={`text-sm ${pwMsg.includes('updated') ? 'text-green-700' : 'text-red-600'}`}>
              {pwMsg}
            </p>
          )}
          <button
            type="submit"
            disabled={pwLoading}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {pwLoading ? 'Saving…' : 'Update password'}
          </button>
        </form>
      </section>
    </div>
  );
}
