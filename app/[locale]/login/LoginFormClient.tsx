'use client';

/**
 * Login: email or username + password.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import PasswordInputWithToggle from '@/components/PasswordInputWithToggle';
import { DEFAULT_LOCALE, type AppLocale } from '@/i18n/locales';
import { routing } from '@/i18n/routing';
import { publicPathForLocale } from '@/lib/public-path-with-locale';

const AUTH_DEBUG =
  process.env.NEXT_PUBLIC_AUTH_DEBUG === '1' || process.env.NEXT_PUBLIC_AUTH_DEBUG === 'true';

function authDebug(...args: unknown[]) {
  if (!AUTH_DEBUG) return;
  // Keep logs consistent and easy to remove/grep.
  console.debug('[auth-debug]', ...args);
}

const NON_DEFAULT_PREFIX_LOCALES = new Set(
  routing.locales.filter((l) => l !== DEFAULT_LOCALE),
);

function safeCallbackUrl(locale: string, raw: string | undefined): string {
  const fallback = publicPathForLocale(locale, '/dashboard');
  if (!raw || typeof raw !== 'string') return fallback;
  let t = raw.trim();
  if (!t.startsWith('/') || t.startsWith('//')) return fallback;

  if (locale === DEFAULT_LOCALE) {
    if (t === '/en' || t.startsWith('/en/')) {
      t = t === '/en' ? '/' : t.slice(3) || '/';
    }
    const seg = t.split('/').filter(Boolean)[0];
    if (seg && NON_DEFAULT_PREFIX_LOCALES.has(seg as AppLocale)) return fallback;
    return t;
  }

  if (t !== `/${locale}` && !t.startsWith(`/${locale}/`)) return fallback;
  return t;
}

type SessionResponse =
  | { user: unknown; expires: string }
  | null;

async function waitForSessionReady(timeoutMs = 4000): Promise<boolean> {
  const started = Date.now();
  let delay = 150;
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch('/api/auth/session', { cache: 'no-store' });
      if (res.ok) {
        const json = (await res.json().catch(() => null)) as SessionResponse;
        if (json && typeof json === 'object' && 'user' in json && (json as { user?: unknown }).user) {
          authDebug('session-ready', { waitedMs: Date.now() - started });
          return true;
        }
      }
    } catch {
      // ignore and retry
    }
    await new Promise((r) => setTimeout(r, delay));
    delay = Math.min(600, Math.floor(delay * 1.6));
  }
  return false;
}

export default function LoginFormClient({
  locale,
  callbackUrlFromServer,
}: {
  locale: string;
  callbackUrlFromServer: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const callbackUrl = safeCallbackUrl(locale, callbackUrlFromServer);
  const hasNavigatedRef = useRef(false);

  // If the user intentionally opened /login to switch accounts, allow staying on the page:
  // - /login?stay=1
  // - /login?switch=1
  // - /login?noRedirect=1
  const stayOnLogin = useMemo(() => {
    const v =
      searchParams?.get('stay') ||
      searchParams?.get('switch') ||
      searchParams?.get('noRedirect');
    if (!v) return false;
    return v === '1' || v.toLowerCase() === 'true' || v.toLowerCase() === 'yes';
  }, [searchParams]);

  useEffect(() => {
    authDebug('login-page-session-status', status);
  }, [status]);

  // If already signed in, do not show the login UI; redirect to dashboard.
  // Using `replace` avoids back button returning to login.
  // Avoid redirect loops and repeated navigation calls.
  useEffect(() => {
    if (status !== 'authenticated') return;
    if (stayOnLogin) {
      authDebug('auto-redirect-skipped(stayOnLogin)', { pathname });
      return;
    }
    // Only do this from the login page path.
    if (!pathname?.endsWith('/login')) return;
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    authDebug('auto-redirect-authenticated', { to: publicPathForLocale(locale, '/dashboard') });
    router.replace(publicPathForLocale(locale, '/dashboard'));
  }, [status, locale, router, pathname, stayOnLogin]);

  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordForAuth = password.trim();

  // Prevent flicker: show a minimal loading state until we know auth status.
  // Do NOT redirect while status === "loading".
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center text-slate-600">
          Checking session…
        </div>
      </div>
    );
  }

  // If authenticated, effect above will redirect; keep UI clean.
  if (status === 'authenticated') return null;

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const res = await signIn('credentials', {
        login: login.trim(),
        password: passwordForAuth,
        redirect: false,
      });
      authDebug('signIn(credentials) response', { ok: res?.ok, error: res?.error, url: res?.url });
      if (!res?.ok) {
        setError('Wrong credentials entered');
        return;
      }
      // Production hosts can have a short delay before the session cookie is readable by server components.
      // Wait briefly to avoid a login->dashboard->login bounce.
      setInfo('Signing you in…');
      const ready = await waitForSessionReady(5000);
      authDebug('post-login session check', { ready });

      // Do not rely on `useSession` for redirect. Navigate explicitly after success.
      authDebug('redirect-after-login', { to: callbackUrl });
      window.location.href = `${window.location.origin}${callbackUrl}`;
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="relative mx-auto mb-6 h-28 w-28 shrink-0">
          <Image
            src="/doddapaneni-logo.png"
            alt="Logo"
            fill
            className="object-contain"
            sizes="112px"
            loading="lazy"
          />
        </div>

        <h1 className="text-slate-600 text-center text-sm mb-2">Sign in</h1>
        <p className="text-slate-500 text-center text-xs mb-6 leading-relaxed">
          Enter your email <strong>or</strong> username and password. No email codes or extra steps — sign in with your
          password only.
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
              onChange={(e) => {
                setLogin(e.target.value);
                if (error) setError('');
              }}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="your email or username"
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <PasswordInputWithToggle
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              required
              className="flex w-full min-w-0 items-center rounded-lg border border-slate-300 bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
              inputClassName="min-w-0 flex-1 border-0 bg-transparent px-4 py-2.5 text-slate-900 outline-none ring-0"
              autoComplete="current-password"
            />
            {error ? (
              <p className="text-sm font-medium text-red-600" role="alert">
                {error}
              </p>
            ) : null}
          </div>
          {info && !error ? (
            <p className="text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">{info}</p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
