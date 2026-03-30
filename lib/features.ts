import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type FeatureName =
  | 'scheduling'
  | 'seoScore'
  | 'previewSharing'
  | 'errorMonitoring'
  | 'analyticsDashboard'
  | (string & {});

/** Built-in flags shown in Super Admin UI (order preserved). */
export const FEATURE_FLAG_DEFINITIONS: ReadonlyArray<{
  name: string;
  label: string;
  description: string;
}> = [
  { name: 'scheduling', label: 'Scheduling', description: 'Scheduled publish for pages and blogs' },
  { name: 'seoScore', label: 'SEO score', description: 'SEO score and suggestions in marketer dashboard' },
  { name: 'previewSharing', label: 'Preview sharing', description: 'Token-based draft preview links' },
  { name: 'errorMonitoring', label: 'Error monitoring', description: 'Developer error log panel' },
  { name: 'analyticsDashboard', label: 'Analytics dashboard', description: 'Developer observability / analytics panel' },
];

type FeatureCacheEntry = { enabled: boolean; fetchedAt: number };

const CACHE_TTL_MS = 30_000;
const cache: Map<string, FeatureCacheEntry> = new Map();

/** Call after toggles change so server reads fresh DB state immediately. */
export function invalidateFeatureFlagCache(name?: string): void {
  if (name) cache.delete(String(name));
  else cache.clear();
}

async function getFeatureToggle(name: FeatureName): Promise<boolean> {
  const existing = cache.get(name);
  if (existing && Date.now() - existing.fetchedAt < CACHE_TTL_MS) {
    return existing.enabled;
  }

  const row = await prisma.featureToggle.findUnique({
    where: { name: String(name) },
    select: { enabled: true },
  });

  const enabled = !!row?.enabled; // Default is disabled when row is missing.
  cache.set(String(name), { enabled, fetchedAt: Date.now() });
  return enabled;
}

/**
 * Returns whether a feature flag is enabled.
 * Default behavior: if the toggle row does not exist, the feature is DISABLED.
 */
export async function isFeatureEnabled(name: FeatureName): Promise<boolean> {
  return getFeatureToggle(name);
}

/**
 * Marketer APIs: block non-null `scheduledPublishAt` when Scheduling is off.
 * `null` always allowed (clears a schedule).
 */
export async function schedulingForbiddenIfScheduled(
  scheduledPublishAt: Date | null,
): Promise<NextResponse | null> {
  if (scheduledPublishAt == null) return null;
  if (await isFeatureEnabled('scheduling')) return null;
  return NextResponse.json(
    {
      message:
        'Scheduling is disabled. Enable "Scheduling" in Super Admin → Feature flags, or clear the scheduled publish time.',
    },
    { status: 403 },
  );
}

