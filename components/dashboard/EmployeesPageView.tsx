'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, UserCircle, Clock, FileCode } from 'lucide-react';
import type { Role } from '@/lib/constants';

type EmployeeSession = {
  logId: string;
  loggedAt: string;
  loggedOutAt: string | null;
  timeOnlineMinutes: number;
  pageViews: { path: string; visitedAt: string }[];
};

type EmployeeWithStats = {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  role: Role;
  sessions: EmployeeSession[];
  isActive: boolean;
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

export default function EmployeesPageView({
  employees,
  locale,
  dashboardHref,
}: {
  employees: EmployeeWithStats[];
  locale: string;
  dashboardHref: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(employees[0]?.id ?? null);
  const selected = employees.find((e) => e.id === selectedId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={dashboardHref}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium"
        >
          <ArrowLeft size={18} />
          Back to dashboard
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
        <UserCircle size={28} className="text-slate-600" />
        Employees
      </h1>

      <div className="flex flex-col lg:flex-row gap-6 min-h-[480px]">
        <aside className="w-full lg:w-72 shrink-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-700/50 shadow-lg shadow-slate-200/20 dark:shadow-black/40 overflow-hidden">
          <div className="p-3 border-b border-slate-200 bg-slate-50/80">
            <h2 className="text-sm font-semibold text-slate-700">Employee list</h2>
          </div>
          <nav className="p-2 max-h-[420px] overflow-y-auto">
            {employees.length === 0 ? (
              <p className="p-4 text-slate-500 text-sm text-center">No employees yet.</p>
            ) : (
              employees.map((emp) => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => setSelectedId(emp.id)}
                  className={`w-full text-left px-3 py-3 rounded-xl mb-1 transition-colors flex items-start gap-2 ${
                    selectedId === emp.id
                      ? 'bg-slate-200 text-slate-900 border border-slate-300'
                      : 'hover:bg-slate-100 text-slate-800 border border-transparent'
                  }`}
                >
                  <span
                    className={`shrink-0 mt-1.5 w-2.5 h-2.5 rounded-full border border-slate-300 ${
                      emp.isActive ? 'bg-slate-600' : 'bg-slate-300'
                    }`}
                    title={emp.isActive ? 'Active' : 'Inactive'}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <p className="font-medium truncate">{emp.name || emp.email}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {emp.username ? `@${emp.username} · ` : ''}
                      {emp.email}
                    </p>
                    <span className={`inline-block mt-1.5 px-2 py-0.5 rounded text-xs font-medium ${roleBadgeClass[String(emp.role)] ?? 'bg-slate-100 text-slate-700'}`}>
                      {roleLabel[String(emp.role)] ?? String(emp.role)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </nav>
        </aside>

        <main className="flex-1 min-w-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-700/50 shadow-lg shadow-slate-200/20 dark:shadow-black/40 overflow-hidden">
          {!selected ? (
            <div className="p-8 text-center text-slate-500">
              <UserCircle size={48} className="mx-auto mb-3 text-slate-300" />
              <p>Select an employee from the list to view their stats.</p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900">{selected.name || selected.email}</h2>
                <p className="text-sm text-slate-600 mt-0.5">
                  {selected.username ? (
                    <>
                      <span className="font-mono">@{selected.username}</span>
                      <span className="text-slate-400 mx-1">·</span>
                    </>
                  ) : null}
                  {selected.email}
                </p>
                <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-lg text-xs font-medium ${roleBadgeClass[String(selected.role)] ?? 'bg-slate-100 text-slate-700'}`}>
                  {roleLabel[String(selected.role)] ?? String(selected.role)}
                </span>
              </div>

              <section>
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                  <Clock size={16} className="text-slate-600" />
                  Login sessions
                </h3>
                {selected.sessions.length === 0 ? (
                  <p className="text-slate-500 text-sm">No login sessions recorded.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selected.sessions.map((s) => (
                      <div
                        key={s.logId}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm"
                      >
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          <span className="text-slate-600">
                            Logged in: {new Date(s.loggedAt).toLocaleString()}
                          </span>
                          <span className="text-slate-600">
                            Logged out: {s.loggedOutAt ? new Date(s.loggedOutAt).toLocaleString() : 'Still online'}
                          </span>
                          <span className="font-medium text-slate-800">
                            Time online: {s.timeOnlineMinutes < 60 ? `${s.timeOnlineMinutes} min` : `${(s.timeOnlineMinutes / 60).toFixed(1)} h`}
                          </span>
                        </div>
                        {s.pageViews.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-100">
                            <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mb-1">
                              <FileCode size={12} />
                              Pages worked on
                            </p>
                            <ul className="list-disc list-inside text-xs text-slate-600 space-y-0.5">
                              {s.pageViews.map((pv, i) => (
                                <li key={i} title={new Date(pv.visitedAt).toLocaleString()}>
                                  {pv.path}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
