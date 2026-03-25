'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { LayoutDashboard, LogOut, Shield } from 'lucide-react';
import type { Role } from '@/lib/constants';

const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  DEVELOPER: 'Developer',
  DIGITAL_MARKETER: 'Digital Marketer',
};

export default function DashboardHeader({
  user,
  locale,
}: {
  user: { email: string; name: string | null; role: Role };
  locale: string;
}) {
  return (
    <header className="sticky top-0 z-10 w-full bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4 py-3 px-6 sm:px-8 lg:px-12 xl:px-16">
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="text-lg font-bold text-slate-900 truncate">Dashboard</h1>
        <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-slate-700 text-white">
          {roleLabels[user.role]}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="hidden md:inline text-sm text-slate-600 truncate max-w-[180px]" title={user.email}>
          {user.email}
        </span>
        <Link
          href={`/${locale}/dashboard/security`}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          title="Password & 2FA"
        >
          <Shield size={18} />
          <span className="hidden sm:inline">Security</span>
        </Link>
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <LayoutDashboard size={18} />
          <span className="hidden sm:inline">View site</span>
        </Link>
        <button
          type="button"
          onClick={async () => {
            try {
              await fetch('/api/session/logout', { method: 'POST' });
            } catch {
              // ignore
            }
            signOut({ callbackUrl: `/${locale}/login` });
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
      </div>
    </header>
  );
}
