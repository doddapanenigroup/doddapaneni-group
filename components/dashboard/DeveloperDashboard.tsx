'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Code2, FileText, Globe, Mail, ExternalLink, BookOpen, Pencil, Languages, Users } from 'lucide-react';
import EditContentModal from './EditContentModal';
import MyActivityPanel from './MyActivityPanel';
import type { Role } from '@/lib/constants';
import { getDashboardTitle } from '@/lib/dashboard-title';
import DeveloperObservabilityPanel from './DeveloperObservabilityPanel';
import DeveloperErrorsPanel from './DeveloperErrorsPanel';
import DeveloperRequestMonitorPanel from './DeveloperRequestMonitorPanel';
import DeveloperTasksPanel from './DeveloperTasksPanel';
import DeveloperEnvPanel from './DeveloperEnvPanel';
import DeveloperCachePanel from './DeveloperCachePanel';
import DeveloperTimelinePanel from './DeveloperTimelinePanel';
import DeveloperAuditPanel from './DeveloperAuditPanel';
import FeatureGate from '@/components/FeatureGate';
import DashboardPageHeader from './DashboardPageHeader';
import CareersJobsPanel from './CareersJobsPanel';
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
  const [translateResult, setTranslateResult] = useState<{ results: { locale: string; translated: number; skipped: number }[] } | null>(null);
  const [translateError, setTranslateError] = useState<string | null>(null);
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
    <div className="space-y-8">
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

      <CareersJobsPanel locale={locale} />

      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.07)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/25">
        <div className="p-5 border-b border-slate-100/95 bg-gradient-to-r from-slate-50/98 to-white dark:border-slate-800 dark:from-slate-800/45 dark:to-slate-900/85">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <BookOpen size={18} className="text-slate-600" />
            How to change the code
          </h2>
        </div>
        <div className="p-5 space-y-3 text-slate-700 text-sm">
          <ol className="list-decimal list-inside space-y-2">
            <li>Open the project folder in your code editor (Cursor or VS Code).</li>
            <li>In a terminal: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">npm run dev</code>.</li>
            <li>Edit the files (see table in the guide). Save; the site will reload.</li>
            <li>Use the <strong>Site pages</strong> links below to open each page and check your changes.</li>
          </ol>
          <p className="text-slate-600 pt-2">
            Full guide: <code className="bg-slate-100 px-1 rounded">docs/DEVELOPER_GUIDE.md</code>
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.07)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/25">
        <h2 className="text-lg font-semibold text-slate-800 p-5 border-b border-slate-100/95 bg-gradient-to-r from-slate-50/98 to-white dark:border-slate-800 dark:from-slate-800/45 dark:to-slate-900/85 flex items-center gap-2">
          <Globe size={20} className="text-slate-600" />
          Site pages — every page on the website
        </h2>
        <p className="px-5 pt-3 text-sm text-slate-600">
          <strong>Edit code</strong> or <strong>Messages (en)</strong> to change pages or copy. When you save <strong>Messages (en)</strong>, all other languages (te, hi, es) are translated automatically from English.
        </p>
        <div className="p-5 grid gap-3 sm:grid-cols-2">
          {sitePages.map((page) => (
            <div
              key={page.href}
              className="flex flex-col rounded-xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-100 transition-all overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 gap-2">
                <Link
                  href={page.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-slate-800 font-medium min-w-0 flex-1"
                >
                  {page.icon}
                  <span className="truncate">{page.label}</span>
                </Link>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingPage(page)}
                    className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                    title="Edit content (updates live site)"
                  >
                    <Pencil size={18} />
                  </button>
                  <Link
                    href={page.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors"
                    title="Open page"
                  >
                    <ExternalLink size={18} />
                  </Link>
                </div>
              </div>
              <p className="px-4 pb-3 text-xs text-slate-500 font-mono truncate" title={page.editFile}>
                Edit: {page.editFile}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.07)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/25">
        <h2 className="text-lg font-semibold text-slate-800 p-5 border-b border-slate-100/95 bg-gradient-to-r from-slate-50/98 to-white dark:border-slate-800 dark:from-slate-800/45 dark:to-slate-900/85 flex items-center gap-2">
          <Languages size={20} className="text-slate-600" />
          Multi-lingual — automatic translation
        </h2>
        <p className="px-5 pt-3 text-sm text-slate-600">
          Default: fills <strong>te</strong>, <strong>hi</strong>, and <strong>es</strong> from English via MyMemory (free, no key)—usually a few minutes. For every app locale or a custom list, set{' '}
          <code className="bg-slate-100 px-1 rounded text-xs">TRANSLATE_ALL_APP_LOCALES=true</code> or{' '}
          <code className="bg-slate-100 px-1 rounded text-xs">TRANSLATE_LOCALES=te,hi,es</code> in{' '}
          <code className="bg-slate-100 px-1 rounded text-xs">.env</code> (slow in the browser; prefer{' '}
          <code className="bg-slate-100 px-1 rounded text-xs">npm run i18n:translate</code>).
        </p>
        <div className="p-5 flex flex-wrap items-center gap-3">
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
                  setTranslateError(typeof data.message === 'string' ? data.message : `Request failed (${res.status})`);
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
          >
            <Languages size={18} />
            {translateLoading ? 'Translating…' : 'Translate all locales'}
          </button>
          {translateError && (
            <p className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg max-w-2xl" role="alert">
              {translateError}
            </p>
          )}
          {translateResult && (
            <div className="text-sm text-slate-600">
              {translateResult.results.map((r) => (
                <span key={r.locale} className="mr-3 block sm:inline sm:mr-3 mt-1 sm:mt-0">
                  <strong>{r.locale}</strong>: {r.translated} translated, {r.skipped} skipped
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      <FeatureGate feature="analyticsDashboard">
        <DeveloperObservabilityPanel />
      </FeatureGate>

      <FeatureGate feature="errorMonitoring">
        <DeveloperErrorsPanel />
      </FeatureGate>

      <FeatureGate feature="analyticsDashboard">
        <DeveloperRequestMonitorPanel />
      </FeatureGate>

      <DeveloperTasksPanel />

      <DeveloperEnvPanel />

      <DeveloperCachePanel />

      <DeveloperTimelinePanel />

      <DeveloperAuditPanel />

      <MyActivityPanel />

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
