'use client';

import { usePathname as useNextPathname } from 'next/navigation';
import { useMemo } from 'react';
import type { AbstractIntlMessages } from 'next-intl';
import { NextIntlClientProvider } from 'next-intl';
import LayoutWithNav from '@/components/LayoutWithNav';
import LocaleHtmlLang from '@/components/LocaleHtmlLang';
import Providers from '@/components/Providers';
import type { AppLocale } from '@/lib/locale-from-path';
import { stripLocalePrefixFromPathname } from '@/lib/locale-from-path';
import { routing } from '@/i18n/routing';
import { getMessagesForLocale } from '@/lib/messages';

type Props = {
  children: React.ReactNode;
  initialPathname: string;
  initialLocale: AppLocale;
  initialMessages: AbstractIntlMessages;
};

/** First segment of the real URL path (includes /te, /hi when locale prefix is present). */
function localeFromFullPathname(pathname: string): AppLocale {
  const seg = pathname.split('/').filter(Boolean)[0];
  if (seg && routing.locales.includes(seg as AppLocale)) {
    return seg as AppLocale;
  }
  return routing.defaultLocale;
}

export default function CorporateHubShell({
  children,
  initialPathname,
  initialLocale,
  initialMessages,
}: Props) {
  const fullPath = useNextPathname() ?? '';
  const pathForNav = stripLocalePrefixFromPathname(fullPath) || initialPathname;
  const urlLocale = useMemo(() => localeFromFullPathname(fullPath), [fullPath]);

  // Prefer messages for the URL locale; fall back to the server-provided initial bundle.
  // `getMessagesForLocale` merges shared namespaces like DivisionTopics/CompanyForms.
  const messages = useMemo(() => {
    if (urlLocale === initialLocale) return initialMessages;
    return getMessagesForLocale(urlLocale) as AbstractIntlMessages;
  }, [initialLocale, initialMessages, urlLocale]);

  return (
    <Providers>
      <NextIntlClientProvider
        locale={urlLocale}
        messages={messages}
        timeZone="Asia/Kolkata"
      >
        <LocaleHtmlLang />
        <LayoutWithNav initialPathname={pathForNav}>{children}</LayoutWithNav>
      </NextIntlClientProvider>
    </Providers>
  );
}
