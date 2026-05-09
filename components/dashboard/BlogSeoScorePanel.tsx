'use client';

import { useMemo } from 'react';
import { dashboardNestedCardClass } from '@/lib/dashboard-ui';

export type BlogSeoScoreInput = {
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  focusKeyword: string;
  content: string;
  ogImage?: string | null;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function stripHtmlToText(value: string | null | undefined): string {
  if (!value) return '';
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseKeywordsCsv(csv: string): string[] {
  return (csv ?? '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
}

type Check = { ok: boolean; label: string };

function computeChecks(args: BlogSeoScoreInput): Check[] {
  const contentText = stripHtmlToText(args.content);
  const metaTitle = args.metaTitle.trim();
  const title = args.title.trim();
  const desc = args.metaDescription.trim();
  const keywords = parseKeywordsCsv(args.keywords);
  const focus = args.focusKeyword.trim().toLowerCase();
  const slug = args.slug.trim();
  const bodyLower = contentText.toLowerCase();
  const headingHasFocus = new RegExp(`<h[12][^>]*>[^<]*${focus.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');

  return [
    { ok: metaTitle.length >= 40 && metaTitle.length <= 60, label: 'Meta title is 40-60 chars' },
    { ok: desc.length >= 120 && desc.length <= 160, label: 'Meta description is 120-160 chars' },
    { ok: title.length >= 25, label: 'Article title is descriptive (>= 25 chars)' },
    { ok: contentText.length >= 900, label: 'Article content length is strong (>= 900 chars)' },
    { ok: keywords.length > 0, label: 'Keywords are provided' },
    { ok: !!focus, label: 'Focus keyword is provided' },
    { ok: !focus || slug.toLowerCase().includes(focus), label: 'Slug includes focus keyword' },
    { ok: !focus || bodyLower.includes(focus), label: 'Content includes focus keyword' },
    { ok: !focus || headingHasFocus.test(args.content), label: 'At least one heading includes focus keyword' },
    { ok: !!args.ogImage, label: 'OG image is set' },
  ];
}

export function computeBlogSeoSummary(args: BlogSeoScoreInput): {
  score: number;
  passed: number;
  total: number;
  label: string;
  tone: 'emerald' | 'amber' | 'rose';
  message: string;
} {
  const checks = computeChecks(args);
  const passed = checks.filter((c) => c.ok).length;
  const total = checks.length;
  const score = Math.round((passed / total) * 100);
  const tone = score >= 80 ? 'emerald' : score >= 55 ? 'amber' : 'rose';
  const label = tone === 'emerald' ? 'Good' : tone === 'amber' ? 'Average' : 'Poor';
  const message =
    tone === 'emerald'
      ? 'Great! Your content is SEO friendly.'
      : tone === 'amber'
        ? 'Close — a few SEO tweaks will help.'
        : 'Several SEO basics still need attention.';
  return { score, passed, total, label, tone, message };
}

type Props = BlogSeoScoreInput & { layout?: 'stacked' | 'side' };

export default function BlogSeoScorePanel(props: Props) {
  const { layout = 'stacked', ...scoreProps } = props;
  const summary = useMemo(() => computeBlogSeoSummary(scoreProps), [scoreProps]);
  const { score, label, tone, message } = summary;

  const toneText =
    tone === 'emerald'
      ? 'text-emerald-700 dark:text-emerald-300'
      : tone === 'amber'
        ? 'text-amber-700 dark:text-amber-300'
        : 'text-rose-700 dark:text-rose-300';
  const stroke =
    tone === 'emerald'
      ? 'stroke-emerald-500'
      : tone === 'amber'
        ? 'stroke-amber-500'
        : 'stroke-rose-500';
  const checks = useMemo(() => computeChecks(scoreProps), [scoreProps]);

  if (layout === 'side') {
    return (
      <div className="mt-4 flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50/90 p-4 dark:border-slate-700 dark:bg-slate-800/40 lg:mt-0 lg:max-w-[300px] lg:justify-self-end xl:sticky xl:top-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">SEO score</p>
          <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-800 ring-1 ring-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
              Good
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-900 ring-1 ring-amber-200/80 dark:bg-amber-950/40 dark:text-amber-200">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden />
              Average
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 font-medium text-rose-900 ring-1 ring-rose-200/80 dark:bg-rose-950/40 dark:text-rose-200">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" aria-hidden />
              Poor
            </span>
          </div>
        </div>
        <div className={`mx-auto flex flex-col items-center gap-2 rounded-xl border border-slate-100 bg-white px-5 py-4 dark:border-slate-600 dark:bg-slate-900 ${dashboardNestedCardClass}`}>
          <div className="relative h-32 w-32">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36" aria-hidden>
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                className="stroke-slate-200 dark:stroke-slate-600"
                strokeWidth="3"
                pathLength={100}
                strokeDasharray="100 0"
              />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                className={stroke}
                strokeWidth="3"
                strokeLinecap="round"
                pathLength={100}
                strokeDasharray={`${clamp(score, 0, 100)} ${100 - clamp(score, 0, 100)}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <p className={`text-3xl font-bold leading-none ${toneText}`}>{score}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">/ 100</p>
              <p className={`mt-0.5 text-sm font-semibold ${toneText}`}>{label}</p>
            </div>
          </div>
          <p className="text-center text-xs leading-snug text-slate-600 dark:text-slate-400">{message}</p>
        </div>
        <div className="max-h-52 space-y-1.5 overflow-y-auto pr-1">
          {checks.map((check) => (
            <p
              key={check.label}
              className={`rounded-md border px-2 py-1 text-[11px] leading-snug ${
                check.ok
                  ? 'border-emerald-100 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200'
                  : 'border-amber-100 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-100'
              }`}
            >
              {check.ok ? '✓' : '○'} {check.label}
            </p>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`mt-6 flex flex-col gap-4 border-t border-slate-100 pt-6 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between`}>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          SEO score
        </p>
        <div className="flex flex-wrap gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-800 ring-1 ring-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900/50">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
            Good
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-900 ring-1 ring-amber-200/80 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900/50">
            <span className="h-2 w-2 rounded-full bg-amber-400" aria-hidden />
            Average
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2 py-0.5 font-medium text-rose-900 ring-1 ring-rose-200/80 dark:bg-rose-950/40 dark:text-rose-200 dark:ring-rose-900/50">
            <span className="h-2 w-2 rounded-full bg-rose-500" aria-hidden />
            Poor
          </span>
        </div>
      </div>

      <div className={`flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/80 px-6 py-4 dark:border-slate-700 dark:bg-slate-800/40 ${dashboardNestedCardClass} !shadow-none`}>
        <div className="relative h-28 w-28">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36" aria-hidden>
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              className="stroke-slate-200 dark:stroke-slate-600"
              strokeWidth="3"
              pathLength={100}
              strokeDasharray="100 0"
            />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              className={stroke}
              strokeWidth="3"
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray={`${clamp(score, 0, 100)} ${100 - clamp(score, 0, 100)}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className={`text-2xl font-bold leading-none ${toneText}`}>{score}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">/ 100</p>
            <p className={`mt-0.5 text-xs font-semibold ${toneText}`}>{label}</p>
          </div>
        </div>
        <p className="max-w-[14rem] text-center text-xs leading-snug text-slate-600 dark:text-slate-400">{message}</p>
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        {checks.map((check) => (
          <p
            key={check.label}
            className={`rounded-lg border px-2 py-1.5 text-xs ${
              check.ok
                ? 'border-emerald-100 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200'
                : 'border-amber-100 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-100'
            }`}
          >
            {check.ok ? '✓' : '○'} {check.label}
          </p>
        ))}
      </div>
    </div>
  );
}
