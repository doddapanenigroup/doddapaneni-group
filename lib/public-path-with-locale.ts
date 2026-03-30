import { routing } from '@/i18n/routing';

/** Public site path with optional locale prefix (`as-needed`). Safe for client components. */
export function publicPathWithLocale(locale: string, ...segments: string[]): string {
  const path = `/${segments.filter(Boolean).join('/')}`;
  if (locale === routing.defaultLocale) return path;
  return `/${locale}${path}`;
}
