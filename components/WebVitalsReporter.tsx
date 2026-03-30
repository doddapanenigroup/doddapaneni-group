'use client';

import { useEffect } from 'react';
import type { Metric } from 'web-vitals';

/** Local console checks against production targets (LCP, CLS, INP / FID-style budgets). */
function logThresholdViolation(metric: Metric) {
  if (process.env.NODE_ENV === 'production') return;
  const lcp = metric.name === 'LCP' && metric.value > 2500;
  const cls = metric.name === 'CLS' && metric.value > 0.1;
  const inp = metric.name === 'INP' && metric.value > 200;
  if (lcp || cls || inp) {
    const display =
      metric.name === 'CLS' ? metric.value.toFixed(3) : `${Math.round(metric.value)}ms`;
    console.warn(`[Web Vitals] ${metric.name} ${display} (${metric.rating}) — target LCP≤2.5s, CLS≤0.1`);
  }
}

function flush(metric: Metric) {
  logThresholdViolation(metric);
  if (process.env.NODE_ENV !== 'production') return;
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    idMetric: metric.id,
    navigationType: metric.navigationType,
    pagePath: typeof window !== 'undefined' ? window.location.pathname : undefined,
  });
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    navigator.sendBeacon('/api/web-vitals', new Blob([body], { type: 'application/json' }));
    return;
  }
  fetch('/api/web-vitals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  }).catch(() => {});
}

export default function WebVitalsReporter() {
  useEffect(() => {
    let cancelled = false;
    void import('web-vitals').then(({ onCLS, onFCP, onINP, onLCP, onTTFB }) => {
      if (cancelled) return;
      onLCP(flush);
      onINP(flush);
      onCLS(flush);
      onFCP(flush);
      onTTFB(flush);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
