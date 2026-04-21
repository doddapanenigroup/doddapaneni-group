/**
 * Canonical site origin for sitemaps, robots, and absolute URLs.
 * Configure with NEXT_PUBLIC_SITE_URL or SITE_URL (with or without protocol).
 */
export function getSiteOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');

  if (raw) {
    try {
      const withProto = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
      return new URL(withProto).origin.replace(/\/$/, '');
    } catch {
      // fall through
    }
  }

  /** Public default; override with `NEXT_PUBLIC_SITE_URL` / `SITE_URL` (www vs apex). */
  return 'https://www.doddapanenigroup.net';
}
