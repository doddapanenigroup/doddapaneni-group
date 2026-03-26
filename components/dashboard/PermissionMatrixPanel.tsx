'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ShieldCheck, Save } from 'lucide-react';
import type { Role } from '@/lib/constants';
import { useDashboardShortcuts } from '@/components/dashboard/DashboardShortcutsProvider';

type Row = { role: Role; module: string; allowed: boolean; updatedAt: string };

const ROLES: Role[] = ['SUPER_ADMIN', 'ADMIN', 'DEVELOPER', 'DIGITAL_MARKETER'];
const MODULE_LABEL: Record<string, string> = {
  pages: 'Pages',
  blogs: 'Blogs',
  developer_tools: 'Developer tools',
};

export default function PermissionMatrixPanel() {
  const { pushSaveLayer } = useDashboardShortcuts();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modules, setModules] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const res = await fetch('/api/super-admin/module-permissions');
    const json = (await res.json().catch(() => null)) as { modules?: string[]; items?: any[]; message?: string } | null;
    if (!res.ok) {
      setError(json?.message ?? 'Failed to load');
      setLoading(false);
      return;
    }
    setModules(json?.modules ?? []);
    setRows((json?.items ?? []) as Row[]);
    setDirty({});
    setLoading(false);
  }

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, []);

  const matrix = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const r of rows) map.set(`${r.role}:${r.module}`, !!r.allowed);
    return map;
  }, [rows]);

  function getAllowed(role: Role, module: string) {
    const k = `${role}:${module}`;
    return dirty[k] ?? matrix.get(k) ?? true; // default true keeps old behavior
  }

  function setAllowed(role: Role, module: string, allowed: boolean) {
    const k = `${role}:${module}`;
    setDirty((d) => ({ ...d, [k]: allowed }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const updates = Object.entries(dirty).map(([key, allowed]) => {
        const [role, module] = key.split(':');
        return { role, module, allowed };
      });
      const res = await fetch('/api/super-admin/module-permissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });
      const json = (await res.json().catch(() => null)) as { message?: string } | null;
      if (!res.ok) throw new Error(json?.message ?? 'Save failed');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const hasChanges = Object.keys(dirty).length > 0;

  const saveRef = useRef(save);
  saveRef.current = save;
  const hasChangesRef = useRef(hasChanges);
  hasChangesRef.current = hasChanges;

  useEffect(() => {
    return pushSaveLayer(() => {
      if (hasChangesRef.current) void saveRef.current();
    });
  }, [pushSaveLayer]);

  return (
    <section className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-700/50 shadow-lg shadow-slate-200/20 dark:shadow-black/40 overflow-hidden">
      <h2 className="text-lg font-semibold text-slate-800 p-5 border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40 flex items-center gap-2">
        <ShieldCheck size={20} className="text-slate-600" />
        Permission matrix (roles × modules)
      </h2>

      <div className="p-5">
        {loading ? (
          <p className="text-sm text-slate-500">Loading permissions…</p>
        ) : error ? (
          <p className="text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-lg p-3">{error}</p>
        ) : (
          <div className="space-y-4">
            <div className="overflow-auto rounded-xl border border-slate-200">
              <table className="min-w-[680px] w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Role</th>
                    {modules.map((m) => (
                      <th key={m} className="text-left px-4 py-3 font-semibold text-slate-700">
                        {MODULE_LABEL[m] ?? m}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {ROLES.map((r) => (
                    <tr key={r}>
                      <td className="px-4 py-3 font-medium text-slate-800">{r}</td>
                      {modules.map((m) => (
                        <td key={`${r}-${m}`} className="px-4 py-3">
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={getAllowed(r, m)}
                              onChange={(e) => setAllowed(r, m, e.target.checked)}
                            />
                            <span className="text-slate-600">{getAllowed(r, m) ? 'Allowed' : 'Denied'}</span>
                          </label>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => save()}
                disabled={!hasChanges || saving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-700 text-white px-4 py-2 text-sm hover:bg-slate-800 disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? 'Saving…' : 'Save permissions'}
              </button>
              <button
                type="button"
                onClick={() => load()}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 text-slate-700 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
              >
                Reload
              </button>
              <span className="text-xs text-slate-500">
                Defaults are “allowed” unless explicitly denied, so existing role behavior won’t change until you toggle.
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

