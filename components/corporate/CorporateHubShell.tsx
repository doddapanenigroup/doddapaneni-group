'use client';

import { usePathname as useNextPathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { AbstractIntlMessages } from 'next-intl';
import { NextIntlClientProvider } from 'next-intl';
import LayoutWithNav from '@/components/LayoutWithNav';
import LocaleHtmlLang from '@/components/LocaleHtmlLang';
import Providers from '@/components/Providers';
import type { AppLocale } from '@/lib/locale-from-path';
import { stripLocalePrefixFromPathname } from '@/lib/locale-from-path';
import { routing } from '@/i18n/routing';

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

  const [intlBundle, setIntlBundle] = useState(() => ({
    locale: initialLocale,
    messages: initialMessages,
  }));
  const intlRef = useRef(intlBundle);
  intlRef.current = intlBundle;

  useEffect(() => {
    if (intlRef.current.locale === urlLocale) return;
    let cancelled = false;
    void (async () => {
      try {
        const mod =
          urlLocale === 'en'
            ? await import('@/messages/en.json')
            : await import(`@/messages/${urlLocale}.json`);
        if (!cancelled) {
          setIntlBundle((prev) => {
            if (prev.locale === urlLocale) return prev;
            return { locale: urlLocale, messages: mod.default as AbstractIntlMessages };
          });
        }
      } catch {
        const mod = await import('@/messages/en.json');
        if (!cancelled) {
          setIntlBundle({ locale: 'en', messages: mod.default as AbstractIntlMessages });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [urlLocale]);

  return (
    <Providers>
      <NextIntlClientProvider
        locale={intlBundle.locale}
        messages={intlBundle.messages}
        timeZone="Asia/Kolkata"
      >
        <LocaleHtmlLang />
        <LayoutWithNav initialPathname={pathForNav}>{children}</LayoutWithNav>
      </NextIntlClientProvider>
    </Providers>
  );
}
