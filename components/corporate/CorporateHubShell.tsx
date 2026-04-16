'use client';

import { usePathname as useNextPathname } from 'next/navigation';
import { useMemo } from 'react';
import LayoutWithNav from '@/components/LayoutWithNav';
import LocaleHtmlLang from '@/components/LocaleHtmlLang';
import Providers from '@/components/Providers';
import type { AppLocale } from '@/lib/locale-from-path';
import { resolveAppLocaleFromPathname, stripLocalePrefixFromPathname } from '@/lib/locale-from-path';
import { getMessagesForLocale } from '@/lib/messages';
import { DictionaryProvider } from '@/lib/dictionary-react';

type Props = {
  children: React.ReactNode;
  initialPathname: string;
  initialLocale: AppLocale;
  initialMessages: Record<string, unknown>;
};

export default function CorporateHubShell({
  children,
  initialPathname,
  initialLocale,
  initialMessages,
}: Props) {
  const fullPath = useNextPathname() ?? '';
  const pathForNav = stripLocalePrefixFromPathname(fullPath) || initialPathname;
  const urlLocale = useMemo(() => resolveAppLocaleFromPathname(fullPath || '/'), [fullPath]);

  const messages = useMemo(() => {
    if (urlLocale === initialLocale) return initialMessages;
    return getMessagesForLocale(urlLocale) as Record<string, unknown>;
  }, [initialLocale, initialMessages, urlLocale]);

  return (
    <Providers>
      <DictionaryProvider locale={urlLocale} messages={messages}>
        <LocaleHtmlLang />
        <LayoutWithNav initialPathname={pathForNav}>{children}</LayoutWithNav>
      </DictionaryProvider>
    </Providers>
  );
}
