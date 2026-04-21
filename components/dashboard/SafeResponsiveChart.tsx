'use client';

import { useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { ResponsiveContainer } from 'recharts';

/** Default height for dashboard charts (explicit px avoids ResponsiveContainer 0-size issues). */
export const DASHBOARD_CHART_HEIGHT = 300;

type SafeResponsiveChartProps = {
  height?: number;
  className?: string;
  loadingFallback?: ReactNode;
  /** Single Recharts chart element (e.g. `<LineChart>...</LineChart>`). */
  children: ReactElement;
};

/**
 * Wraps Recharts `ResponsiveContainer` with a fixed-height box and only mounts the chart
 * once the container has non-zero width and height (fixes blank/flicker in flex/hidden layouts).
 */
export function SafeResponsiveChart({
  height = DASHBOARD_CHART_HEIGHT,
  className,
  loadingFallback,
  children,
}: SafeResponsiveChartProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const measure = () => {
      const r = el.getBoundingClientRect();
      setReady(r.width > 1 && r.height > 1);
    };

    measure();
    if (typeof ResizeObserver === 'undefined') {
      const t = window.setInterval(measure, 150);
      return () => window.clearInterval(t);
    }
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [height]);

  return (
    <div
      ref={wrapRef}
      className={['w-full min-w-0', className].filter(Boolean).join(' ')}
      style={{ height, minHeight: height }}
    >
      {ready ? (
        <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={32}>
          {children}
        </ResponsiveContainer>
      ) : loadingFallback ? (
        <>{loadingFallback}</>
      ) : (
        <div
          className="flex h-full w-full items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400"
          aria-busy="true"
          aria-label="Loading chart"
        >
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          Loading chart...
        </div>
      )}
    </div>
  );
}
