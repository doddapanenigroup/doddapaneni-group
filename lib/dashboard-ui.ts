/**
 * Shared Tailwind class strings for dashboard surfaces — one visual system across roles.
 */
export const dashboardPanelClass =
  'overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.07)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/25';

export const dashboardPanelHeaderClass =
  'border-b border-slate-100/95 bg-gradient-to-r from-slate-50/98 to-white px-5 py-4 dark:border-slate-800 dark:from-slate-800/45 dark:to-slate-900/85';

/** Compact panel header (e.g. loading / error states) */
export const dashboardPanelShellClass = `${dashboardPanelClass} p-5`;

export const dashboardHeaderActionSecondary =
  'inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-700/80';

export const dashboardHeaderActionPrimary =
  'inline-flex items-center gap-2 rounded-xl border border-transparent bg-slate-900 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500';
