'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { AbstractIntlMessages } from 'next-intl';
import { NextIntlClientProvider } from 'next-intl';
import LayoutWithNav from '@/components/LayoutWithNav';
import LocaleHtmlLang from '@/components/LocaleHtmlLang';
import Providers from '@/components/Providers';
import { resolveAppLocaleFromPathname, type AppLocale } from '@/lib/locale-from-path';

type Props = {
  children: React.ReactNode;
  initialPathname: string;
  initialLocale: AppLocale;
  initialMessages: AbstractIntlMessages;
};

export default function CorporateHubShell({
  children,
  initialPathname,
  initialLocale,
  initialMessages,
}: Props) {
  const pathname = usePathname() ?? '';
  const pathForNav = pathname || initialPathname;
  const pathLocale = useMemo(() => resolveAppLocaleFromPathname(pathForNav), [pathForNav]);

  const [intlBundle, setIntlBundle] = useState(() => ({
    locale: initialLocale,
    messages: initialMessages,
  }));

  useEffect(() => {
    if (pathLocale === intlBundle.locale) return;
    let cancelled = false;
    (async () => {
      try {
        const mod =
          pathLocale === 'en'
            ? await import('@/messages/en.json')
            : await import(`@/messages/${pathLocale}.json`);
        if (!cancelled) {
          setIntlBundle({
            locale: pathLocale,
            messages: mod.default as AbstractIntlMessages,
          });
        }
      } catch {
        const mod = await import('@/messages/en.json');
        if (!cancelled) {
          setIntlBundle({
            locale: 'en',
            messages: mod.default as AbstractIntlMessages,
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathLocale, intlBundle.locale]);

  return (
    <Providers>
      <NextIntlClientProvider locale={intlBundle.locale} messages={intlBundle.messages}>
        <LocaleHtmlLang />
        <LayoutWithNav initialPathname={pathForNav}>{children}</LayoutWithNav>
      </NextIntlClientProvider>
    </Providers>
  );
}
