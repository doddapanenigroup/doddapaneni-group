/**
 * Google Search Console HTML tag verification (in `app/layout.tsx` `<head>`).
 * Override in production with `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` if the token changes.
 */
export const GOOGLE_SITE_VERIFICATION =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() ||
  'hz1gnEwKPg6vepXcHuuze94PQ1z2V22paJkCNYdy3xY';
