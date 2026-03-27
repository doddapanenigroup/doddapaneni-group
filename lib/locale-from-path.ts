import { routing } from '@/i18n/routing';

export type AppLocale = (typeof routing.locales)[number];

/**
 * Valid `[locale]` route segment, else default locale.
 * Prefer this in `page.tsx` over `headers()` so App Router can cache/ISR and still ship full HTML to crawlers.
 */
export function localeFromRouteParam(paramLocale: string): AppLocale {
  if (routing.locales.includes(paramLocale as AppLocale)) {
    return paramLocale as AppLocale;
  }
  return routing.defaultLocale;
}

/** Resolve next-intl locale from the browser URL pathname (includes locale prefix when present). */
export function resolveAppLocaleFromPathname(pathname: string): AppLocale {
  const seg = pathname.split('/').filter(Boolean)[0];
  if (seg && routing.locales.includes(seg as AppLocale)) {
    return seg as AppLocale;
  }
  return routing.defaultLocale;
}
