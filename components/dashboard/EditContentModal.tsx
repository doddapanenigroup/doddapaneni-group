'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Save } from 'lucide-react';
import { useDashboardShortcuts } from '@/components/dashboard/DashboardShortcutsProvider';
import {
  dashboardHeaderActionPrimary,
  dashboardHeaderActionSecondary,
  dashboardIconButtonClass,
  dashboardInputClass,
  dashboardModalBackdropClass,
  dashboardModalFrameClass,
  dashboardPanelHeaderClass,
} from '@/lib/dashboard-ui';

type EditContentModalProps = {
  pageKey: string;
  label: string;
  editFile: string;
  onClose: () => void;
};

export default function EditContentModal({ pageKey, label, editFile, onClose }: EditContentModalProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const { pushEscLayer, pushSaveLayer } = useDashboardShortcuts();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    return pushEscLayer(() => onClose());
  }, [pushEscLayer, onClose]);

  useEffect(() => {
    if (loading) return;
    return pushSaveLayer(() => {
      formRef.current?.requestSubmit();
    });
  }, [loading, pushSaveLayer]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/developer/file?pageKey=${encodeURIComponent(pageKey)}`);
        if (!res.ok) throw new Error('Fetch failed');
        const data = await res.json();
        if (!cancelled && data?.content !== undefined) {
          setContent(data.content);
        }
      } catch {
        if (!cancelled) setContent('');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [pageKey]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('idle');
    try {
      const res = await fetch('/api/developer/file', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageKey, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? 'Save failed');
      setMessage('success');
      if (pageKey === 'messages-en' && data?.translateAll?.results?.length) {
        setMessage('success');
      }
      setTimeout(() => onClose(), pageKey === 'messages-en' && data?.translateAll ? 3000 : 1500);
    } catch {
      setMessage('error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={dashboardModalBackdropClass}>
      <div className={`${dashboardModalFrameClass} max-w-5xl shadow-2xl`}>
      <div className={`flex shrink-0 items-center justify-between sm:px-6 ${dashboardPanelHeaderClass}`}>
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-slate-900 truncate">Edit code — {label}</h2>
          <p className="text-sm text-slate-500 font-mono truncate mt-0.5" title={editFile}>
            {editFile}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={`${dashboardIconButtonClass} ml-2 shrink-0`}
          aria-label="Close"
        >
          <X size={24} />
        </button>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col p-4 sm:p-6">
        {loading ? (
          <p className="text-slate-500">Loading file…</p>
        ) : (
          <form ref={formRef} onSubmit={handleSave} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 min-h-0 flex flex-col mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Full source code — edit and save to update the file
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                spellCheck={false}
                className={`min-h-[min(60vh,480px)] flex-1 resize-none font-mono text-sm leading-relaxed ${dashboardInputClass}`}
                placeholder="Loading…"
                style={{ tabSize: 2 }}
              />
            </div>
            {message === 'success' && (
              <p className="text-slate-700 text-sm font-medium mb-2">
                {pageKey === 'messages-en'
                  ? 'Saved. All locales (te, hi, es) have been translated automatically from English.'
                  : 'Saved to file. The site will update (e.g. with npm run dev).'}
              </p>
            )}
            {message === 'error' && (
              <p className="text-slate-700 text-sm font-medium mb-2">Failed to save file. Try again.</p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className={`${dashboardHeaderActionPrimary} disabled:opacity-50`}
              >
                <Save size={18} />
                {saving ? 'Saving…' : 'Save to file'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className={dashboardHeaderActionSecondary}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
      </div>
    </div>
  );
}
