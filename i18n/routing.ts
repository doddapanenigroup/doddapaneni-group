import { APP_LOCALES, DEFAULT_LOCALE } from './locales';

/**
 * Path-based locales: English has no URL prefix (`/about`); others use `/te`, `/hi`, `/es`.
 */
export const routing = {
  locales: [...APP_LOCALES],
  defaultLocale: DEFAULT_LOCALE,
} as const;

export type RoutingLocale = (typeof routing.locales)[number];
