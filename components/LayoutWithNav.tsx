'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import RecordVisit from '@/components/RecordVisit';
import WebVitalsReporter from '@/components/WebVitalsReporter';

export default function LayoutWithNav({
  children,
  initialPathname = '',
}: {
  children: React.ReactNode;
  initialPathname?: string;
}) {
  const pathnameFromHook = usePathname();
  const pathname = pathnameFromHook ?? initialPathname;
  const hidePublicNav = pathname.includes('/dashboard') || pathname.includes('/login');

  if (hidePublicNav) {
    return (
      <div className="flex min-h-screen flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-slate-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-blue-400"
        >
          Skip to main content
        </a>
        <main id="main-content" tabIndex={-1} className="flex-1 w-full min-w-0 outline-none">
          {children}
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-900 focus:shadow-lg focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-blue-600"
      >
        Skip to main content
      </a>
      <RecordVisit />
      <WebVitalsReporter />
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex min-h-0 w-full min-w-0 flex-1 flex-col outline-none">
        {children}
      </main>
      <Footer />
    </div>
  );
}
