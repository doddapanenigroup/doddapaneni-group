'use client';

/**
 * Login: email or username + password, then email OTP code to finish sign-in.
 */

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import PasswordInputWithToggle from '@/components/PasswordInputWithToggle';
import { mediaUrl } from '@/lib/media';

function safeCallbackUrl(locale: string, raw: string | undefined): string {
  const fallback = `/${locale}/dashboard`;
  if (!raw || typeof raw !== 'string') return fallback;
  const t = raw.trim();
  if (!t.startsWith('/') || t.startsWith('//')) return fallback;
  if (t !== `/${locale}` && !t.startsWith(`/${locale}/`)) return fallback;
  return t;
}

type Step = 'credentials' | 'code';

export default function LoginFormClient({
  locale,
  callbackUrlFromServer,
}: {
  locale: string;
  callbackUrlFromServer: string;
}) {
  const callbackUrl = safeCallbackUrl(locale, callbackUrlFromServer);

  const [step, setStep] = useState<Step>('credentials');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordForAuth = password.trim();

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
    setLoading(true);
    try {
      const res = await signIn('credentials', {
        login: login.trim(),
        password: passwordForAuth,
        emailOtp: emailOtp.replace(/\s/g, ''),
        redirect: false,
        callbackUrl,
      });
      if (res?.error) {
        setError('Invalid or expired code. Try again or request a new code.');
        return;
      }
      // On some hosts/Auth.js versions, `res.url` may point back to the sign-in page even when auth succeeded.
      // Since `redirect:false` is used, always navigate to our validated callbackUrl on success.
      window.location.href = callbackUrl.startsWith('http')
        ? callbackUrl
        : `${window.location.origin}${callbackUrl}`;
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
        <div className="flex justify-center mb-6">
          <Image src={mediaUrl('logo.webp')} alt="Logo" width={80} height={80} />
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
