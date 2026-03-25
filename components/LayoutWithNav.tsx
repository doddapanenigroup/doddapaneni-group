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
  const hideNav = pathname.includes('/dashboard') || pathname.includes('/login');

  if (hideNav) {
    return <>{children}</>;
  }

  return (
    <>
      <RecordVisit />
      <WebVitalsReporter />
      <Navbar />
      <main className="flex-grow w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        {children}
      </main>
      <Footer />
    </>
  );
}
