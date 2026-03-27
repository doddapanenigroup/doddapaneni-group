import { routing } from '@/i18n/routing';

export type AppLocale = (typeof routing.locales)[number];

/** Resolve next-intl locale from the browser URL pathname (includes locale prefix when present). */
export function resolveAppLocaleFromPathname(pathname: string): AppLocale {
  const seg = pathname.split('/').filter(Boolean)[0];
  if (seg && routing.locales.includes(seg as AppLocale)) {
    return seg as AppLocale;
  }
  return routing.defaultLocale;
}
