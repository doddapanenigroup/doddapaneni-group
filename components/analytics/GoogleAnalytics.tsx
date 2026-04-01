'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

type Props = {
  measurementId: string;
};

export default function GoogleAnalytics({ measurementId }: Props) {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    if (!measurementId?.trim()) return;
    if (typeof window === 'undefined') return;
    if (typeof window.gtag !== 'function') return;
    const qs = window.location.search || '';
    window.gtag('config', measurementId, { page_path: `${pathname}${qs}` });
  }, [pathname, measurementId]);

  if (!measurementId?.trim()) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
window.dataLayer = window.dataLayer || [];
function gtag(){window.dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', '${measurementId}');
        `}
      </Script>
    </>
  );
}

