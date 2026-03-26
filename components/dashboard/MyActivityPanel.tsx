'use client';

import { useEffect, useState } from 'react';
import { History } from 'lucide-react';

type DevPayload = {
  role: 'DEVELOPER';
  contentEdits: {
    id: string;
    createdAt: string;
    kind: string;
    targetPath: string;
    summary: string | null;
  }[];
  pageViews: { path: string; visitedAt: string }[];
};

type MarketerPayload = {
  role: 'DIGITAL_MARKETER';
  marketingActivity: {
    id: string;
    createdAt: string;
    entity: string;
    action: string;
    seoNote: string | null;
    payloadJson: string | null;
  }[];
};

export default function MyActivityPanel() {
  const [data, setData] = useState<DevPayload | MarketerPayload | null>(null);

  useEffect(() => {
    fetch('/api/dashboard/my-activity')
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) return null;

  if (data.role === 'DEVELOPER') {
    return (
      <section className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-700/50 shadow-lg shadow-slate-200/20 dark:shadow-black/40 overflow-hidden">
        <h2 className="text-lg font-semibold text-slate-800 p-5 border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40 flex items-center gap-2">
          <History size={20} className="text-slate-600" />
          Your recent activity
        </h2>
        <div className="p-5 grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-2">Edits saved</h3>
            <ul className="text-sm space-y-2 max-h-56 overflow-y-auto">
              {data.contentEdits.length === 0 ? (
                <li className="text-slate-500">No saved edits yet.</li>
              ) : (
                data.contentEdits.map((e) => (
                  <li key={e.id} className="border border-slate-100 rounded-lg p-2 bg-slate-50/80">
                    <span className="font-mono text-xs text-slate-500">{e.kind}</span>{' '}
                    {e.targetPath}
                    <div className="text-xs text-slate-500">
                      {new Date(e.createdAt).toLocaleString()}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-2">Pages opened in dashboard</h3>
            <ul className="text-sm space-y-1 max-h-56 overflow-y-auto font-mono text-xs">
              {data.pageViews.length === 0 ? (
                <li className="text-slate-500">No page views recorded.</li>
              ) : (
                data.pageViews.map((p, i) => (
                  <li key={i} className="text-slate-700">
                    {p.path}{' '}
                    <span className="text-slate-400">
                      {new Date(p.visitedAt).toLocaleString()}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-700/50 shadow-lg shadow-slate-200/20 dark:shadow-black/40 overflow-hidden">
      <h2 className="text-lg font-semibold text-slate-800 p-5 border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40 flex items-center gap-2">
        <History size={20} className="text-slate-600" />
        Your marketing &amp; SEO activity
      </h2>
      <ul className="p-5 space-y-2 text-sm max-h-72 overflow-y-auto">
        {data.marketingActivity.length === 0 ? (
          <li className="text-slate-500">No logged changes yet.</li>
        ) : (
          data.marketingActivity.map((m) => (
            <li key={m.id} className="border border-slate-100 rounded-lg p-3 bg-slate-50/80">
              <span className="font-medium capitalize">{m.action}</span> {m.entity}
              <div className="text-xs text-slate-500">{new Date(m.createdAt).toLocaleString()}</div>
              {m.seoNote && <div className="text-xs text-slate-700 mt-1">Note: {m.seoNote}</div>}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
