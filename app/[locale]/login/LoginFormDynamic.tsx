'use client';

import dynamic from 'next/dynamic';

/** Client-only mount: avoids hydration mismatches (stale chunks, extensions). */
const LoginFormClient = dynamic(() => import('./LoginFormClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-4">
        <div className="h-20 mx-auto w-20 rounded-full bg-slate-200 animate-pulse" />
        <div className="h-4 bg-slate-200 rounded w-1/3 mx-auto animate-pulse" />
        <div className="h-3 bg-slate-100 rounded w-full animate-pulse" />
        <div className="h-10 bg-slate-100 rounded animate-pulse" />
        <div className="h-10 bg-slate-100 rounded animate-pulse" />
      </div>
    </div>
  ),
});

export default function LoginFormDynamic({
  locale,
  callbackUrlFromServer,
}: {
  locale: string;
  callbackUrlFromServer: string;
}) {
  return <LoginFormClient locale={locale} callbackUrlFromServer={callbackUrlFromServer} />;
}
