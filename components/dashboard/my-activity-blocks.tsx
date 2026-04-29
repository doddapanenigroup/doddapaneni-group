'use client';

import { History } from 'lucide-react';
import type { Role } from '@/lib/constants';
import { dashboardNestedCardClass, dashboardPanelHeaderClass } from '@/lib/dashboard-ui';

export type ActivityPayload = {
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

export function EditsBlock({ data }: { data: ActivityPayload }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Edits saved</h3>
      <ul className="max-h-[min(60vh,28rem)] space-y-2 overflow-y-auto text-sm">
        {data.contentEdits.length === 0 ? (
          <li className="text-slate-500 dark:text-slate-400">No saved edits yet.</li>
        ) : (
          data.contentEdits.map((e) => (
            <li key={e.id} className={`p-2 ${dashboardNestedCardClass}`}>
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{e.kind}</span> {e.targetPath}
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

export function MarketingBlock({
  data,
  showTitle = true,
}: {
  data: ActivityPayload;
  /** When false, only the list is rendered (e.g. modal already has a title). */
  showTitle?: boolean;
}) {
  const list = (
    <ul className="max-h-[min(65vh,32rem)] space-y-2 overflow-y-auto text-sm">
      {data.marketingActivity.length === 0 ? (
        <li className="text-slate-500 dark:text-slate-400">No logged changes yet.</li>
      ) : (
        data.marketingActivity.map((m) => (
          <li key={m.id} className={`p-3 ${dashboardNestedCardClass}`}>
            <span className="font-medium capitalize">{m.action}</span> {m.entity}
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {new Date(m.createdAt).toLocaleString()}
            </div>
            {m.seoNote ? (
              <div className="mt-1 text-xs text-slate-700 dark:text-slate-300">Note: {m.seoNote}</div>
            ) : null}
          </li>
        ))
      )}
    </ul>
  );
  if (!showTitle) return list;
  return (
    <>
      <h2
        className={`flex items-center gap-2 border-b border-slate-200 p-4 text-base font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-100 ${dashboardPanelHeaderClass}`}
      >
        <History size={18} className="text-slate-600 dark:text-slate-400" />
        Your marketing &amp; SEO activity
      </h2>
      <div className="p-4">{list}</div>
    </>
  );
}
