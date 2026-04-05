'use client';

/**
 * Login: email or username + password, then email OTP code to finish sign-in.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import PasswordInputWithToggle from '@/components/PasswordInputWithToggle';

const AUTH_DEBUG =
  process.env.NEXT_PUBLIC_AUTH_DEBUG === '1' || process.env.NEXT_PUBLIC_AUTH_DEBUG === 'true';

function authDebug(...args: unknown[]) {
  if (!AUTH_DEBUG) return;
  // Keep logs consistent and easy to remove/grep.
  console.debug('[auth-debug]', ...args);
}

function safeCallbackUrl(locale: string, raw: string | undefined): string {
  const fallback = `/${locale}/dashboard`;
  if (!raw || typeof raw !== 'string') return fallback;
  const t = raw.trim();
  if (!t.startsWith('/') || t.startsWith('//')) return fallback;
  if (t !== `/${locale}` && !t.startsWith(`/${locale}/`)) return fallback;
  return t;
}

type Step = 'credentials' | 'code';

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
    authDebug('auto-redirect-authenticated', { to: `/${locale}/dashboard` });
    router.replace(`/${locale}/dashboard`);
  }, [status, locale, router, pathname, stayOnLogin]);

  const [step, setStep] = useState<Step>('credentials');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
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

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 25_000);
      const res = await fetch('/api/auth/login-otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          login: login.trim(),
          password: passwordForAuth,
        }),
      });
      clearTimeout(t);
      const json = (await res.json().catch(() => ({}))) as {
        message?: string;
        codeSentTo?: string;
      };
      if (!res.ok) {
        setError(
          typeof json.message === 'string'
            ? json.message
            : res.status === 503 || res.status === 502
              ? 'Email or database is not ready. Check server logs or hosting env (AUTH_SECRET, DATABASE_URL, SMTP).'
              : res.status === 500
                ? 'Server error (500). Confirm the latest app is deployed and the host has AUTH_SECRET, DATABASE_URL, and email (SMTP) configured.'
                : 'Could not send code.'
        );
        return;
      }
      setStep('code');
      setEmailOtp('');
      const dest = json.codeSentTo ?? 'your email';
      setInfo(`We sent a 6-digit code to ${dest}. Enter it below to sign in.`);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError(
          'This is taking too long (timeout). The server may be blocked from sending email (SMTP) or DNS. Try again, or check Hostinger runtime logs.'
        );
        return;
      }
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 25_000);
      const res = await fetch('/api/auth/login-otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          login: login.trim(),
          password: passwordForAuth,
        }),
      });
      clearTimeout(t);
      const json = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setError(typeof json.message === 'string' ? json.message : 'Could not resend code.');
        return;
      }
      setInfo('A new code was sent to your email.');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError(
          'Resend timed out. The server may be blocked from sending email (SMTP) or DNS. Check Hostinger runtime logs.'
        );
        return;
      }
      setError('Could not resend code.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const res = await signIn('credentials', {
        login: login.trim(),
        password: passwordForAuth,
        emailOtp: emailOtp.replace(/\s/g, ''),
        redirect: false,
      });
      authDebug('signIn(credentials) response', { ok: res?.ok, error: res?.error, url: res?.url });
      if (!res?.ok) {
        setError(
          typeof res?.error === 'string' && res.error.trim()
            ? res.error
            : 'Login failed. Please check the code and try again.'
        );
        return;
      }
      // Production hosts can have a short delay before the session cookie is readable by server components.
      // Wait briefly to avoid a login->dashboard->login bounce.
      setInfo('Signing you in…');
      const ready = await waitForSessionReady(5000);
      authDebug('post-login session check', { ready });

      // Do not rely on `useSession` for redirect. Navigate explicitly after success.
      authDebug('redirect-after-login', { to: `/${locale}/dashboard` });
      window.location.href = `${window.location.origin}/${locale}/dashboard`;
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function goBackToCredentials() {
    setStep('credentials');
    setEmailOtp('');
    setError('');
    setInfo('');
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

        {step === 'credentials' ? (
          <>
            <h1 className="text-slate-600 text-center text-sm mb-2">Sign in</h1>
            <p className="text-slate-500 text-center text-xs mb-6 leading-relaxed">
              Enter your email <strong>or</strong>{' '}
              username and password. We email a one-time code to your account&apos;s email address to finish
              sign-in.
            </p>
            <form onSubmit={handleSendCode} className="space-y-4">
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
                {loading ? 'Sending…' : 'Send verification code'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-slate-600 text-center text-sm mb-2">Check your email</h1>
            {info && (
              <p className="text-slate-600 text-center text-xs mb-4 leading-relaxed">{info}</p>
            )}
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label htmlFor="emailOtp" className="block text-sm font-medium text-slate-700 mb-1">
                  Verification code
                </label>
                <input
                  id="emailOtp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value)}
                  required
                  minLength={6}
                  maxLength={12}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 tracking-widest text-center text-lg"
                  placeholder="000000"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading || emailOtp.replace(/\s/g, '').length < 6}
                className="w-full py-3 px-4 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
            <div className="mt-4 flex flex-col gap-2 text-center text-sm">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading}
                className="text-blue-600 hover:underline disabled:opacity-50"
              >
                Resend code
              </button>
              <button
                type="button"
                onClick={goBackToCredentials}
                className="text-slate-600 hover:text-slate-900"
              >
                Use a different account
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
