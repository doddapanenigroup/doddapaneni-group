'use client';

import { useEffect } from 'react';
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';
import type { Metric } from 'web-vitals';

function flush(metric: Metric) {
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
    if (process.env.NODE_ENV !== 'production') return;
    onLCP(flush);
    onINP(flush);
    onCLS(flush);
    onFCP(flush);
    onTTFB(flush);
  }, []);

  return null;
}
