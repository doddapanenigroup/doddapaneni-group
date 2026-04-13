import { APP_LOCALES, DEFAULT_LOCALE } from './locales';

/**
 * Path-based locales for SEO (`/en/...`, `/te/...`, …). English always uses the `/en/` prefix.
 */
export const routing = {
  locales: [...APP_LOCALES],
  defaultLocale: DEFAULT_LOCALE,
} as const;

export type RoutingLocale = (typeof routing.locales)[number];
