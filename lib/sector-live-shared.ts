import { COMPANY_DIVISION_SLUGS } from '@/lib/company-divisions';

/**
 * Browser-safe helpers (no Prisma). Import this from client components — never import
 * `sector-repository` or DB helpers alongside these in a shared barrel that clients load.
 */

/** Default: every division slug is not live until the API/DB says otherwise. */
export const EMPTY_SECTOR_LIVE_MAP: Record<string, boolean> = Object.fromEntries(
  COMPANY_DIVISION_SLUGS.map((slug) => [slug, false]),
);

/** Parse `/api/public/sectors` JSON — same shape as the navbar poll. */
export function sectorLiveMapFromApiPayload(d: { sectors?: unknown }): Record<string, boolean> {
  const rows = Array.isArray(d?.sectors) ? d.sectors : [];
  const map: Record<string, boolean> = { ...EMPTY_SECTOR_LIVE_MAP };
  for (const s of rows) {
    if (s && typeof s === 'object' && typeof (s as { slug?: unknown }).slug === 'string') {
      const key = String((s as { slug: string }).slug)
        .trim()
        .toLowerCase();
      if (key in map) {
        map[key] = Boolean((s as { isLive?: unknown }).isLive);
      }
    }
  }
  return map;
}

/** Build live flags from a sectors map (avoids a second DB round-trip on news routes). */
export function sectorLiveMapFromBySlugMap(
  bySlug: Map<string, { isLive: boolean } | undefined>,
): Record<string, boolean> {
  const map: Record<string, boolean> = { ...EMPTY_SECTOR_LIVE_MAP };
  for (const slug of COMPANY_DIVISION_SLUGS) {
    map[slug] = bySlug.get(slug)?.isLive ?? false;
  }
  return map;
}

/** Client (news UI): defer first `/api/public/sectors` poll so LCP is not contending with that request. */
export const NEWS_SECTOR_LIVE_FIRST_POLL_MS = 4500;
/** Slower than navbar (5s): news pages prioritize fast load over instant admin toggle feedback. */
export const NEWS_SECTOR_LIVE_POLL_MS = 25000;
