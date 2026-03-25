'use client';

/**
 * Login: email or username + password.
 */

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import PasswordInputWithToggle from '@/components/PasswordInputWithToggle';

function safeCallbackUrl(locale: string, raw: string | undefined): string {
  const fallback = `/${locale}/dashboard`;
  if (!raw || typeof raw !== 'string') return fallback;
  const t = raw.trim();
  if (!t.startsWith('/') || t.startsWith('//')) return fallback;
  if (t !== `/${locale}` && !t.startsWith(`/${locale}/`)) return fallback;
  return t;
}

export default function LoginFormClient({
  locale,
  callbackUrlFromServer,
}: {
  locale: string;
  callbackUrlFromServer: string;
}) {
  const callbackUrl = safeCallbackUrl(locale, callbackUrlFromServer);

  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordForAuth = password.trim();

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await signIn('credentials', {
        login: login.trim(),
        password: passwordForAuth,
        redirect: false,
        callbackUrl,
      });
      if (res?.error) {
        setError('Invalid email, username, or password.');
        return;
      }
      const url = res?.url ?? callbackUrl;
      window.location.href = url.startsWith('http') ? url : `${window.location.origin}${url}`;
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="flex justify-center mb-6">
          <Image src="/logo.webp" alt="Logo" width={80} height={80} />
        </div>

        <h1 className="text-slate-600 text-center text-sm mb-2">Sign in</h1>
        <p className="text-slate-500 text-center text-xs mb-6 leading-relaxed">
          Use your email <strong>or</strong> username and your password.
        </p>
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label htmlFor="login" className="block text-sm font-medium text-slate-700 mb-1">
              Email or username
            </label>
            <input
              id="login"
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="your email or username"
              autoComplete="username"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <PasswordInputWithToggle
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="flex w-full min-w-0 items-center rounded-lg border border-slate-300 bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
              inputClassName="min-w-0 flex-1 border-0 bg-transparent px-4 py-2.5 text-slate-900 outline-none ring-0"
              autoComplete="current-password"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
