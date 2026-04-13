'use client';

import dynamic from 'next/dynamic';
import type { HomeDivision } from '@/lib/business-divisions-home';

const HomeDivisionsGrid = dynamic(() => import('./HomeDivisionsGrid'), {
  loading: () => (
    <div
      className="min-h-[48rem] border-b border-slate-100 bg-slate-50/80"
      aria-hidden
    />
  ),
});

const HomePageBelowFold = dynamic(() => import('./HomePageBelowFold'), {
  loading: () => (
    <div
      className="flex min-h-[52rem] flex-col items-center bg-[linear-gradient(180deg,rgba(248,250,252,0.6)_0%,transparent_18%,transparent_100%)] pt-20"
      role="status"
      aria-busy="true"
      aria-label="Loading page sections"
    >
      <div
        className="h-9 w-9 animate-spin rounded-full border-2 border-blue-700 border-t-transparent"
        aria-hidden
      />
      <span className="mt-4 text-sm font-medium text-slate-500">Loading…</span>
    </div>
  ),
});

type Props = {
  divisions: HomeDivision[];
};

/** Below-the-fold + client-only sections. Hero is `HomeHero` (server) for faster LCP. */
export default function HomePage({ divisions }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <HomeDivisionsGrid divisions={divisions} />

      <HomePageBelowFold />
    </div>
  );
}
