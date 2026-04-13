'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

type Props = {
  measurementId: string;
};

/**
 * Defer loading GA until the browser is idle (with max delay), so GTmetrix/Lighthouse
 * attribute less script work to the initial critical path and main-thread tasks.
 */
export default function GoogleAnalytics({ measurementId }: Props) {
  const pathname = usePathname();
  const [loadGa, setLoadGa] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const enable = () => {
      if (!cancelled) setLoadGa(true);
    };
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(enable, { timeout: 4000 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }
    const t = window.setTimeout(enable, 4000);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    if (!loadGa) return;
    if (!pathname) return;
    if (!measurementId?.trim()) return;
    if (typeof window.gtag !== 'function') return;
    const qs = window.location.search || '';
    window.gtag('config', measurementId, { page_path: `${pathname}${qs}` });
  }, [loadGa, pathname, measurementId]);

  if (!measurementId?.trim()) return null;
  if (!loadGa) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`} strategy="lazyOnload" />
      <Script id="ga4-init" strategy="lazyOnload">
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

