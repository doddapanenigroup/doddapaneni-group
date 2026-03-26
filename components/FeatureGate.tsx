'use client';

import { ReactNode, useEffect, useState } from 'react';

const FEATURE_FLAGS_CHANGED = 'feature-flags-changed';

export default function FeatureGate({
  feature,
  children,
  fallback = null,
}: {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/features/${encodeURIComponent(feature)}`, {
          cache: 'no-store',
        });
        const json = (await res.json().catch(() => null)) as { enabled?: boolean } | null;
        if (!cancelled) setEnabled(!!json?.enabled);
      } catch {
        if (!cancelled) setEnabled(false);
      }
    }

    setEnabled(null);
    void load();

    const onChanged = (ev: Event) => {
      const d = (ev as CustomEvent<{ name?: string }>).detail;
      if (!d?.name || d.name === feature) void load();
    };
    window.addEventListener(FEATURE_FLAGS_CHANGED, onChanged);
    return () => {
      cancelled = true;
      window.removeEventListener(FEATURE_FLAGS_CHANGED, onChanged);
    };
  }, [feature]);

  if (enabled === null) return null;
  if (!enabled) return <>{fallback}</>;
  return <>{children}</>;
}

