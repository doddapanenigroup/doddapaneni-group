'use client';

import type { ReactNode } from 'react';

/** Feature toggles were removed; children always render. */
export default function FeatureGate({
  children,
  fallback: _fallback = null,
}: {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return <>{children}</>;
}
