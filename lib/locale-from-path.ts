import { routing } from '@/i18n/routing';
import type { AppLocale } from '@/i18n/locales';

export type { AppLocale };

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

/**
 * Path without locale prefix — matches `usePathname()` from `@/i18n/routing` (as-needed prefixing).
 * Use with `usePathname()` from `next/navigation` when you cannot call next-intl hooks yet (e.g. above `NextIntlClientProvider`).
 */
export function stripLocalePrefixFromPathname(fullPathname: string): string {
  const normalized = fullPathname.startsWith('/') ? fullPathname : `/${fullPathname}`;
  const segments = normalized.split('/').filter(Boolean);
  if (segments.length === 0) return '/';
  if (routing.locales.includes(segments[0] as AppLocale)) {
    const rest = segments.slice(1);
    return rest.length ? `/${rest.join('/')}` : '/';
  }
  return normalized;
}
