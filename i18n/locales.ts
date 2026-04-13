/**
 * Single source of truth for supported locales (no next-intl imports).
 * English is default; Telugu, Hindi, Spanish are the only additional UI languages.
 */
export const APP_LOCALES = ['en', 'te', 'hi', 'es'] as const;

export type AppLocale = (typeof APP_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = 'en';
