'use client';

import { useEffect, useState } from 'react';

type BackupItem = {
  id: string;
  createdAt: string;
  createdByEmail: string | null;
  createdByRole: string | null;
  label: string | null;
  includeMedia: boolean;
  sha256: string;
  sizeBytes: number;
};

export default function AdminBackupsPanel() {
  const [items, setItems] = useState<BackupItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [includeMedia, setIncludeMedia] = useState(false);
  const [label, setLabel] = useState('');
  const [restoreId, setRestoreId] = useState('');
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');
  const [confirm, setConfirm] = useState('');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/admin/backups?take=50');
      if (!r.ok) throw new Error('Failed');
      const data = (await r.json()) as { items: BackupItem[] };
      setItems(data.items ?? []);
    } catch {
      setError('Could not load backup history');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createBackup() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch('/api/admin/backups', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ includeMedia, label: label.trim() || undefined }),
      });
      if (!r.ok) {
        const data = (await r.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message || 'Create failed');
      }
      setLabel('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create failed');
    } finally {
      setBusy(false);
    }
  }

  async function restoreBackup() {
    const id = restoreId.trim();
    if (!id) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/admin/backups/${encodeURIComponent(id)}/restore`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode: restoreMode, confirm: confirm.trim() || undefined, label: 'pre-restore' }),
      });
      const data = (await r.json().catch(() => ({}))) as { message?: string };
      if (!r.ok) throw new Error(data.message || 'Restore failed');
      setConfirm('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Restore failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-700/50 shadow-lg shadow-slate-200/20 dark:shadow-black/40 overflow-hidden">
      <div className="p-5 border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40">
        <h2 className="text-lg font-semibold text-slate-800">Backups</h2>
        <p className="text-xs text-slate-500 mt-1">
          Safe DB export and controlled restore. Restore is SUPER_ADMIN-only and creates a pre-restore backup.
        </p>
      </div>

      {error ? <p className="p-4 text-sm text-red-600">{error}</p> : null}
      {loading ? <p className="p-4 text-sm text-slate-500">Loading backups…</p> : null}

      <div className="p-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <p className="text-sm font-medium text-slate-800">Create backup</p>
          <div className="mt-3 space-y-3">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={includeMedia}
                onChange={(e) => setIncludeMedia(e.target.checked)}
              />
              Include media binaries (can be large)
            </label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Label (optional)"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
            <button
              onClick={createBackup}
              disabled={busy}
              className="w-full rounded-xl bg-slate-900 text-white py-2.5 text-sm font-medium hover:bg-slate-800 disabled:opacity-60"
            >
              {busy ? 'Working…' : 'Create backup'}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50/40 p-4">
          <p className="text-sm font-medium text-red-800">Restore (danger zone)</p>
          <p className="text-xs text-red-700 mt-1">
            Use <strong>merge</strong> to avoid deletes. Use <strong>replace</strong> only if you type confirm
            text <code className="bg-red-100 px-1 rounded">RESTORE</code>.
          </p>
          <div className="mt-3 space-y-3">
            <input
              value={restoreId}
              onChange={(e) => setRestoreId(e.target.value)}
              placeholder="Backup ID to restore"
              className="w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-sm"
            />
            <select
              value={restoreMode}
              onChange={(e) => setRestoreMode(e.target.value === 'replace' ? 'replace' : 'merge')}
              className="w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-sm"
            >
              <option value="merge">merge (safe)</option>
              <option value="replace">replace (deletes data)</option>
            </select>
            {restoreMode === 'replace' ? (
              <input
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder='Type RESTORE to confirm'
                className="w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-sm"
              />
            ) : null}
            <button
              onClick={restoreBackup}
              disabled={busy}
              className="w-full rounded-xl bg-red-700 text-white py-2.5 text-sm font-medium hover:bg-red-800 disabled:opacity-60"
            >
              {busy ? 'Working…' : 'Restore backup'}
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 pb-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-slate-800">Backup history</p>
          <button
            onClick={load}
            disabled={busy}
            className="text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60"
          >
            Refresh
          </button>
        </div>
        <div className="mt-3 rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left font-medium p-3">Created</th>
                <th className="text-left font-medium p-3">By</th>
                <th className="text-left font-medium p-3">Label</th>
                <th className="text-left font-medium p-3">Size</th>
                <th className="text-left font-medium p-3">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-slate-500">
                    No backups yet.
                  </td>
                </tr>
              ) : (
                items.map((b) => (
                  <tr key={b.id} className="align-top">
                    <td className="p-3 whitespace-nowrap">{new Date(b.createdAt).toLocaleString()}</td>
                    <td className="p-3">
                      <div className="text-slate-900">{b.createdByEmail ?? '—'}</div>
                      <div className="text-xs text-slate-500">{b.createdByRole ?? '—'}</div>
                    </td>
                    <td className="p-3 text-slate-700">
                      {b.label ?? '—'}
                      {b.includeMedia ? (
                        <div className="text-xs text-slate-500">Includes media</div>
                      ) : null}
                    </td>
                    <td className="p-3 text-slate-700">{Math.round(b.sizeBytes / 1024)} KB</td>
                    <td className="p-3">
                      <a
                        className="text-xs px-3 py-2 inline-block rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
                        href={`/api/admin/backups/${encodeURIComponent(b.id)}/download`}
                      >
                        Download
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

