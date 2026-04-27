/**
 * Shared dashboard surface tokens — calm, readable UI (light borders, soft shadow).
 * Change values here to refresh cards, chrome, and controls in one place.
 */

/** Primary section card */
export const dashboardPanelClass =
  'rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';

/** Title / toolbar strip at top of a panel */
export const dashboardPanelHeaderClass =
  'border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-800/80';

/** Panel with default body padding */
export const dashboardPanelShellClass = `${dashboardPanelClass} p-5`;

/** Nested row, compact tile, quick link */
export const dashboardNestedCardClass =
  'rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600';

/** Text inputs, selects, textareas */
export const dashboardInputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500';

/** Password / icon+input wrapper */
export const dashboardInputShellClass =
  'flex w-full min-w-0 items-center overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm transition focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-900';

/** Horizontal action strip (e.g. admin toolbar) */
export const dashboardToolbarStripClass =
  'flex flex-wrap items-center justify-end gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900';

/** Segmented tabs container */
export const dashboardTabRailClass =
  'inline-flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800';

export const dashboardHeaderActionSecondary =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700';

export const dashboardHeaderActionPrimary =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600';

export const dashboardMainMaxClass = 'mx-auto w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[90rem]';

/** Optional outer frame for grouped sections */
export const dashboardStageClass =
  'rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/50 sm:p-5 xl:p-6';

/** Collapsible / placeholder folds */
export const dashboardDashedFoldClass =
  'overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900/70';

/** Sticky dashboard top bar */
export const dashboardTopBarClass =
  'sticky top-0 z-20 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/95';

export const dashboardIconButtonClass =
  'inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700';

/** Page title card (same language as panels) */
export const dashboardHeroClass = dashboardPanelClass;

export const dashboardSearchTriggerClass =
  'flex h-10 w-full min-w-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-left text-sm text-slate-500 shadow-sm transition hover:border-slate-400 hover:text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-500';

export const dashboardPopoverClass =
  'flex max-h-96 w-[min(20rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900';

export const dashboardCommandPaletteClass =
  'flex w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900';

export const dashboardModalBackdropClass =
  'fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:items-center sm:p-8 dark:bg-black/50';

export const dashboardModalFrameClass =
  'relative my-4 flex max-h-[min(92dvh,calc(100vh-2rem))] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900';

export const dashboardNoticeClass =
  'rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400';

export const dashboardNoticeErrorClass =
  'rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200';

export const dashboardListFrameClass =
  'divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-700 dark:bg-slate-900';
