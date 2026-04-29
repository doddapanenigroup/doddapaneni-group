import { NextResponse } from 'next/server';

type FeatureName =
  | 'scheduling'
  | 'seoScore'
  | 'previewSharing'
  | 'errorMonitoring'
  | 'analyticsDashboard'
  | (string & {});

/** Kept for UI copy only; feature toggles were removed from the product. */
export const FEATURE_FLAG_DEFINITIONS: ReadonlyArray<{
  name: string;
  label: string;
  description: string;
}> = [];

/** No-op: legacy callers after DB feature_toggle removal. */
export function invalidateFeatureFlagCache(_name?: string): void {}

function defaultEnabled(name: FeatureName): boolean {
  switch (name) {
    case 'analyticsDashboard':
      return false;
    case 'scheduling':
    case 'seoScore':
    case 'previewSharing':
    case 'errorMonitoring':
      return true;
    default:
      return false;
  }
}

/**
 * Feature gates without database rows (feature toggles removed).
 * Extend `defaultEnabled` if you need to hide a module again.
 */
export async function isFeatureEnabled(name: FeatureName): Promise<boolean> {
  return defaultEnabled(name);
}

/** Same as {@link isFeatureEnabled} without an async boundary — use on hot paths (e.g. preview shell TTFB). */
export function isFeatureEnabledSync(name: FeatureName): boolean {
  return defaultEnabled(name);
}

/**
 * When scheduling is disabled, forbid creating/updating with a future `scheduledPublishAt`.
 * Scheduling is enabled by default (no DB flag).
 */
export async function schedulingForbiddenIfScheduled(
  scheduledPublishAt: Date | null,
): Promise<NextResponse | null> {
  if (!scheduledPublishAt) return null;
  if (!(await isFeatureEnabled('scheduling'))) {
    return NextResponse.json(
      { message: 'Scheduled publishing is disabled for this deployment.' },
      { status: 403 },
    );
  }
  return null;
}
