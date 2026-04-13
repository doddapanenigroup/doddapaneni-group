import type { AppLocale } from '@/i18n/locales';
import { APP_LOCALES, DEFAULT_LOCALE } from '@/i18n/locales';
import en from '@/content/translations/en.json';
import te from '@/content/translations/te.json';
import hi from '@/content/translations/hi.json';
import es from '@/content/translations/es.json';

/** Build-time JSON bundles (no runtime fetch). */
export const dictionaries = {
  en,
  te,
  hi,
  es,
} as const;

export type Dictionary = (typeof dictionaries)['en'];

export function isAppLocale(value: string): value is AppLocale {
  return (APP_LOCALES as readonly string[]).includes(value);
}

export function getDictionary(locale: string): Dictionary {
  if (isAppLocale(locale)) {
    return dictionaries[locale] as Dictionary;
  }
  return dictionaries[DEFAULT_LOCALE] as Dictionary;
}
