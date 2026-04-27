'use client';

import { useMemo } from 'react';
import { dashboardNestedCardClass } from '@/lib/dashboard-ui';

type Props = {
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

function computeChecks(args: Props): Check[] {
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

export default function BlogSeoScorePanel(props: Props) {
  const checks = useMemo(() => computeChecks(props), [props]);
  const passed = checks.filter((c) => c.ok).length;
  const score = Math.round((passed / checks.length) * 100);
  const tone = score >= 80 ? 'emerald' : score >= 55 ? 'amber' : 'rose';
  const toneText =
    tone === 'emerald' ? 'text-emerald-700' : tone === 'amber' ? 'text-amber-700' : 'text-rose-700';
  const toneBar =
    tone === 'emerald' ? 'bg-emerald-600' : tone === 'amber' ? 'bg-amber-600' : 'bg-rose-600';

  return (
    <div className={`mt-4 p-4 ${dashboardNestedCardClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            SEO score
          </p>
          <p className={`text-sm font-semibold ${toneText}`}>Article SEO readiness</p>
        </div>
        <div className="text-right">
          <p className={`text-3xl font-bold leading-none ${toneText}`}>{score}</p>
          <p className="text-xs text-slate-500">/ 100</p>
        </div>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className={`h-full ${toneBar}`} style={{ width: `${score}%` }} />
      </div>

      <div className="mt-3 space-y-1.5">
        {checks.map((check) => (
          <p
            key={check.label}
            className={`rounded-md border px-2 py-1 text-xs ${
              check.ok
                ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                : 'border-amber-100 bg-amber-50 text-amber-800'
            }`}
          >
            {check.ok ? 'OK' : 'Fix'}: {check.label}
          </p>
        ))}
      </div>
    </div>
  );
}
