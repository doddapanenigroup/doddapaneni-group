import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['en', 'te', 'hi', 'es'],

  // Used when no locale matches
  defaultLocale: 'en',

  // Don't show locale prefix in URL for default locale (e.g. doddapanenigroup.net instead of doddapanenigroup.net/en)
  localePrefix: 'as-needed'
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const {Link, redirect, usePathname, useRouter, getPathname} =
  createNavigation(routing);
