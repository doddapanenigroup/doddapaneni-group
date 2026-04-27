'use client';

import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import type { Role } from '@/lib/constants';
import { hasDeveloperAccess, hasMarketerAccess, isMarketer } from '@/lib/role-utils';
import { dashboardNestedCardClass, dashboardPanelClass, dashboardPanelHeaderClass } from '@/lib/dashboard-ui';

type ActivityPayload = {
  role: Role;
  contentEdits: {
    id: string;
    createdAt: string;
    kind: string;
    targetPath: string;
    summary: string | null;
  }[];
  pageViews: { path: string; visitedAt: string }[];
  marketingActivity: {
    id: string;
    createdAt: string;
    entity: string;
    action: string;
    seoNote: string | null;
    payloadJson: string | null;
  }[];
};

function EditsBlock({ data }: { data: ActivityPayload }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Edits saved</h3>
      <ul className="text-sm space-y-2 max-h-56 overflow-y-auto">
        {data.contentEdits.length === 0 ? (
          <li className="text-slate-500 dark:text-slate-400">No saved edits yet.</li>
        ) : (
          data.contentEdits.map((e) => (
            <li
              key={e.id}
              className={`p-2 ${dashboardNestedCardClass}`}
            >
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{e.kind}</span>{' '}
              {e.targetPath}
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {new Date(e.createdAt).toLocaleString()}
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function MarketingBlock({ data }: { data: ActivityPayload }) {
  return (
    <>
      <h2 className={`flex items-center gap-2 p-5 text-lg font-semibold text-slate-800 dark:text-slate-100 ${dashboardPanelHeaderClass}`}>
        <History size={20} className="text-slate-600 dark:text-slate-400" />
        Your marketing &amp; SEO activity
      </h2>
      <ul className="p-5 space-y-2 text-sm max-h-72 overflow-y-auto">
        {data.marketingActivity.length === 0 ? (
          <li className="text-slate-500 dark:text-slate-400">No logged changes yet.</li>
        ) : (
          data.marketingActivity.map((m) => (
            <li
              key={m.id}
              className={`p-3 ${dashboardNestedCardClass}`}
            >
              <span className="font-medium capitalize">{m.action}</span> {m.entity}
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {new Date(m.createdAt).toLocaleString()}
              </div>
              {m.seoNote && (
                <div className="text-xs text-slate-700 dark:text-slate-300 mt-1">Note: {m.seoNote}</div>
              )}
            </li>
          ))
        )}
      </ul>
    </>
  );
}

export default function MyActivityPanel() {
  const [data, setData] = useState<ActivityPayload | null>(null);

  useEffect(() => {
    fetch('/api/dashboard/my-activity')
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) return null;

  const showDevGrid = hasDeveloperAccess(data.role) || data.contentEdits.length > 0;

  const showMarketing = hasMarketerAccess(data.role) || data.marketingActivity.length > 0;

  if (isMarketer(data.role) && !showDevGrid && showMarketing) {
    return (
      <section className={dashboardPanelClass}>
        <MarketingBlock data={data} />
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {showDevGrid ? (
        <section className={dashboardPanelClass}>
          <h2 className={`flex items-center gap-2 p-5 text-lg font-semibold text-slate-800 dark:text-slate-100 ${dashboardPanelHeaderClass}`}>
            <History size={20} className="text-slate-600 dark:text-slate-400" />
            Your recent activity
          </h2>
          <div className="p-5">
            <EditsBlock data={data} />
          </div>
        </section>
      ) : null}

      {showMarketing && (!isMarketer(data.role) || showDevGrid) ? (
        <section className={dashboardPanelClass}>
          <MarketingBlock data={data} />
        </section>
      ) : null}
    </div>
  );
}
