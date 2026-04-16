'use client';

import { useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAppLocale as useLocale } from '@/lib/dictionary-react';
import { publicPathForLocale } from '@/lib/public-path-with-locale';

export default function InviteClient() {
  const params = useSearchParams();
  const router = useRouter();
  const locale = useLocale();

  const email = useMemo(() => (params.get('email') ?? '').trim().toLowerCase(), [params]);
  const token = useMemo(() => (params.get('token') ?? '').trim(), [params]);

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    setMsg(null);
    if (!email || !token) {
      setMsg('Invite link is missing information. Please use the link from your email.');
      return;
    }
    if (password.length < 6) {
      setMsg('Password must be at least 6 characters.');
      return;
    }
    if (password !== password2) {
      setMsg('Passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      const r = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, token, password, name: name.trim() || undefined }),
      });
      const data = (await r.json().catch(() => ({}))) as { message?: string };
      if (!r.ok) throw new Error(data.message || 'Invite failed');
      router.replace(`${publicPathForLocale(locale, '/login')}?invited=1`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Invite failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-lg bg-white/90 backdrop-blur rounded-2xl border border-slate-200/80 shadow-xl p-6">
        <h1 className="text-xl font-semibold text-slate-900">Accept invite</h1>
        <p className="text-sm text-slate-600 mt-1">
          Set your password to activate your dashboard account.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600">Email</label>
            <input
              value={email || ''}
              disabled
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600">Name (optional)</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              placeholder="Your name"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-600">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">Confirm password</label>
              <input
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          {msg ? (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">{msg}</p>
          ) : null}

          <button
            onClick={submit}
            disabled={busy}
            className="w-full rounded-xl bg-slate-900 text-white py-2.5 text-sm font-medium hover:bg-slate-800 disabled:opacity-60"
          >
            {busy ? 'Activating…' : 'Set password & activate'}
          </button>

          <p className="text-xs text-slate-500">
            If your invite expired, ask an admin to send you a new invite.
          </p>
        </div>
      </div>
    </div>
  );
}

