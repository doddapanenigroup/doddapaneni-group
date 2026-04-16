'use client';

import NextLink from 'next/link';
import { useParams, usePathname as useNextPathname } from 'next/navigation';
import { forwardRef } from 'react';
import type { AppLocale } from '@/i18n/locales';
import { routing } from '@/i18n/routing';
import { stripLocalePrefixFromPathname } from '@/lib/locale-from-path';
import { publicPathForLocale } from '@/lib/public-path-with-locale';

function withLocalePrefix(locale: string, href: string): string {
  if (!href) return publicPathForLocale(locale, '/');
  if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return href;
  }
  const path = href.startsWith('/') ? href : `/${href}`;
  return publicPathForLocale(locale, path);
}

type LinkProps = Omit<React.ComponentProps<typeof NextLink>, 'href'> & {
  href: string;
  /** Any supported locale string (wires through from server `params` without casts). */
  locale?: string;
};

/** Same-page language switches pass `locale`; otherwise current route `[locale]` is used. */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function LocalizedLink(
  { href, locale: localeProp, ...rest },
  ref,
) {
  const params = useParams();
  const fromUrl = params?.locale;
  const resolved =
    (typeof localeProp === 'string' && routing.locales.includes(localeProp as AppLocale)
      ? localeProp
      : undefined) ??
    (typeof fromUrl === 'string' && routing.locales.includes(fromUrl as AppLocale) ? fromUrl : undefined) ??
    routing.defaultLocale;
  const locale = resolved as AppLocale;

  return <NextLink ref={ref} href={withLocalePrefix(locale, href)} {...rest} />;
});

/**
 * Pathname without the leading `/{locale}` segment (for building links and active states).
 * Mirrors the old next-intl `usePathname()` contract.
 */
export function usePathname(): string {
  const full = useNextPathname() ?? '/';
  return stripLocalePrefixFromPathname(full);
}
