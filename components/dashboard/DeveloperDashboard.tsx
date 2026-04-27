'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Code2, FileText, Globe, Mail, ExternalLink, BookOpen, Pencil, Languages, Users } from 'lucide-react';
import EditContentModal from './EditContentModal';
import MyActivityPanel from './MyActivityPanel';
import type { Role } from '@/lib/constants';
import { getDashboardTitle } from '@/lib/dashboard-title';
import DeveloperErrorsPanel from './DeveloperErrorsPanel';
import DeveloperBuildDeploymentsPanel from './DeveloperBuildDeploymentsPanel';
import DeveloperEnvPanel from './DeveloperEnvPanel';
import DeveloperCachePanel from './DeveloperCachePanel';
import DeveloperAuditPanel from './DeveloperAuditPanel';
import DashboardPageHeader from './DashboardPageHeader';
import CareersJobsPanel from './CareersJobsPanel';
import {
  dashboardDashedFoldClass,
  dashboardMainMaxClass,
  dashboardPanelClass,
  dashboardStageClass,
} from '@/lib/dashboard-ui';
import { publicPathForLocale, publicPathWithLocale } from '@/lib/public-path-with-locale';

type SitePage = {
  href: string;
  label: string;
  pageKey: string;
  editFile: string;
  icon: React.ReactNode;
};

export default function DeveloperDashboard({
  locale,
  viewerRole = 'DEVELOPER',
}: {
  locale: string;
  viewerRole?: Role;
}) {
  const [editingPage, setEditingPage] = useState<SitePage | null>(null);
  const [translateLoading, setTranslateLoading] = useState(false);
  const [translateResult, setTranslateResult] = useState<{
    results: { locale: string; translated: number; skipped: number }[];
  } | null>(null);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [careersOpen, setCareersOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const home = publicPathForLocale(locale, '/');
  const staticPages: SitePage[] = [
    { href: home, label: 'Home', pageKey: 'home', editFile: 'app/[locale]/page.tsx', icon: <Globe size={20} /> },
    { href: publicPathWithLocale(locale, 'about'), label: 'About', pageKey: 'about', editFile: 'app/[locale]/about/page.tsx', icon: <FileText size={20} /> },
    { href: publicPathWithLocale(locale, 'contact'), label: 'Contact', pageKey: 'contact', editFile: 'app/[locale]/contact/page.tsx', icon: <Mail size={20} /> },
    { href: publicPathWithLocale(locale, 'team'), label: 'Team', pageKey: 'team', editFile: 'app/[locale]/team/page.tsx', icon: <Users size={20} /> },
    { href: publicPathWithLocale(locale, 'careers'), label: 'Careers', pageKey: 'careers', editFile: 'app/[locale]/careers/page.tsx', icon: <Globe size={20} /> },
    { href: publicPathWithLocale(locale, 'news'), label: 'News — listing page', pageKey: 'messages-en', editFile: 'messages/en.json', icon: <BookOpen size={20} /> },
    { href: home, label: 'Messages (en) — translations source', pageKey: 'messages-en', editFile: 'messages/en.json', icon: <Languages size={20} /> },
  ];
  const sitePages = staticPages;
  const isDeveloperView = viewerRole === 'DEVELOPER';

  return (
    <div className={`${dashboardMainMaxClass} space-y-5 pb-6`}>
      <DashboardPageHeader
        icon={Code2}
        title={getDashboardTitle(viewerRole)}
        description={
          isDeveloperView ? (
            <>
              Quick links to site pages. Edit code in your editor and run{' '}
              <code className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[13px] font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                npm run dev
              </code>
              .
            </>
          ) : (
            <>
              Manage content and SEO-facing copy across all pages from your dashboard. Edit files and run{' '}
              <code className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[13px] font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                npm run dev
              </code>
              .
            </>
          )
        }
      />

      <div className={dashboardStageClass}>
        <div className="mb-6 max-w-3xl">
          <div className={dashboardDashedFoldClass}>
            <button
              type="button"
              onClick={() => setCareersOpen((o) => !o)}
              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold text-slate-800 dark:text-slate-100"
              aria-expanded={careersOpen}
            >
              <span>Careers & job listings</span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${careersOpen ? 'rotate-180' : ''}`}
                aria-hidden
              />
            </button>
            {careersOpen ? (
              <div className="border-t border-slate-200/80 p-2 dark:border-slate-700 sm:p-3">
                <CareersJobsPanel locale={locale} />
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:items-start xl:gap-8">
          <div className="min-w-0 space-y-6 xl:col-span-5 2xl:col-span-4">
          <section className={dashboardPanelClass}>
            <div className="border-b border-slate-100 bg-slate-50/95 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <BookOpen size={16} className="text-slate-600" />
                How to change the code
              </h2>
            </div>
            <div className="space-y-2 p-3 text-sm leading-snug text-slate-700">
              <ol className="list-inside list-decimal space-y-1.5">
                <li>Open the project folder in your code editor (Cursor or VS Code).</li>
                <li>
                  In a terminal: <code className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-800">npm run dev</code>.
                </li>
                <li>Edit the files (see table in the guide). Save; the site will reload.</li>
                <li>
                  Use the <strong>Site pages</strong> links to open each page and check your changes.
                </li>
              </ol>
              <p className="pt-1 text-xs text-slate-600 sm:text-sm">
                Full guide: <code className="rounded bg-slate-100 px-1">docs/DEVELOPER_GUIDE.md</code>
              </p>
            </div>
          </section>

          <section className={dashboardPanelClass}>
            <h2 className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/95 px-4 py-3 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-900/60">
              <Languages size={16} className="text-slate-600" />
              Multi-lingual — automatic translation
            </h2>
            <p className="px-3 pt-2 text-xs leading-snug text-slate-600 sm:text-sm">
              Default: fills <strong>te</strong>, <strong>hi</strong>, and <strong>es</strong> from English via MyMemory
              (free, no key)—usually a few minutes. For every app locale or a custom list, set{' '}
              <code className="rounded bg-slate-100 px-1 text-xs">TRANSLATE_ALL_APP_LOCALES=true</code> or{' '}
              <code className="rounded bg-slate-100 px-1 text-xs">TRANSLATE_LOCALES=te,hi,es</code> in{' '}
              <code className="rounded bg-slate-100 px-1 text-xs">.env</code> (slow in the browser; prefer{' '}
              <code className="rounded bg-slate-100 px-1 text-xs">npm run i18n:translate</code>).
            </p>
            <div className="flex flex-wrap items-center gap-2 p-3">
              <button
                type="button"
                onClick={async () => {
                  setTranslateLoading(true);
                  setTranslateResult(null);
                  setTranslateError(null);
                  try {
                    const res = await fetch('/api/i18n/translate-all', { method: 'POST' });
                    const data = (await res.json()) as {
                      results?: { locale: string; translated: number; skipped: number }[];
                      message?: string;
                    };
                    if (res.ok && data.results) setTranslateResult({ results: data.results });
                    else {
                      setTranslateResult(null);
                      setTranslateError(
                        typeof data.message === 'string' ? data.message : `Request failed (${res.status})`
                      );
                    }
                  } catch {
                    setTranslateResult(null);
                    setTranslateError(
                      'Network error or request timed out. Try again, or run npm run i18n:translate in a terminal.'
                    );
                  } finally {
                    setTranslateLoading(false);
                  }
                }}
                disabled={translateLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                <Languages size={16} />
                {translateLoading ? 'Translating…' : 'Translate all locales'}
              </button>
              {translateError && (
                <p className="rounded-lg bg-red-50 px-2 py-1.5 text-xs text-red-700 sm:text-sm" role="alert">
                  {translateError}
                </p>
              )}
              {translateResult && (
                <div className="w-full text-xs text-slate-600 sm:text-sm">
                  {translateResult.results.map((r) => (
                    <span key={r.locale} className="mr-2 block sm:inline">
                      <strong>{r.locale}</strong>: {r.translated} translated, {r.skipped} skipped
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <section className={`min-w-0 xl:col-span-7 2xl:col-span-8 ${dashboardPanelClass}`}>
          <h2 className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/95 px-4 py-3 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-900/60">
            <Globe size={16} className="shrink-0 text-slate-600" />
            Site pages — every page on the website
          </h2>
          <p className="px-3 pt-2 text-xs leading-snug text-slate-600 sm:text-sm">
            <strong>Edit code</strong> or <strong>Messages (en)</strong> to change pages or copy. When you save{' '}
            <strong>Messages (en)</strong>, all other languages (te, hi, es) are translated automatically from
            English.
          </p>
          <div className="grid max-h-[min(70vh,520px)] gap-2 overflow-y-auto p-2 sm:grid-cols-2 sm:p-3 sm:pr-1">
            {sitePages.map((page) => (
              <div
                key={`${page.pageKey}:${page.label}`}
                className="flex flex-col rounded-lg border border-slate-200 bg-slate-50/50 text-sm dark:border-slate-600/80"
              >
                <div className="flex items-center justify-between gap-1.5 p-2 sm:p-2.5">
                  <Link
                    href={page.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-w-0 flex-1 items-center gap-2 font-medium text-slate-800"
                  >
                    <span className="shrink-0 scale-90 opacity-90">{page.icon}</span>
                    <span className="truncate text-xs sm:text-sm">{page.label}</span>
                  </Link>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => setEditingPage(page)}
                      className="rounded-md p-1.5 text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600"
                      title="Edit content (updates live site)"
                    >
                      <Pencil size={16} />
                    </button>
                    <Link
                      href={page.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600"
                      title="Open page"
                    >
                      <ExternalLink size={16} />
                    </Link>
                  </div>
                </div>
                <p
                  className="truncate border-t border-slate-100/90 px-2 py-1.5 font-mono text-[10px] text-slate-500 dark:border-slate-600/50 sm:text-xs"
                  title={page.editFile}
                >
                  Edit: {page.editFile}
                </p>
              </div>
            ))}
          </div>
        </section>
        </div>
      </div>

      <div className={`${dashboardStageClass} mt-6`}>
        <div className={dashboardDashedFoldClass}>
          <button
            type="button"
            onClick={() => setToolsOpen((o) => !o)}
            className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold text-slate-800 dark:text-slate-100"
            aria-expanded={toolsOpen}
          >
            <span>Monitoring, environment, cache & activity</span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${toolsOpen ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </button>
          {toolsOpen ? (
            <div className="grid grid-cols-1 gap-4 border-t border-slate-200/80 p-3 sm:grid-cols-2 xl:grid-cols-3 xl:p-4">
              <DeveloperErrorsPanel />
              <DeveloperBuildDeploymentsPanel />
              <DeveloperEnvPanel />
              <DeveloperCachePanel />
              <DeveloperAuditPanel />
              <div className="sm:col-span-2 xl:col-span-3">
                <MyActivityPanel />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {editingPage && (
        <EditContentModal
          pageKey={editingPage.pageKey}
          label={editingPage.label}
          editFile={editingPage.editFile}
          onClose={() => setEditingPage(null)}
        />
      )}
    </div>
  );
}
