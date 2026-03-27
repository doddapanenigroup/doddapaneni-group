'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';

/** Keeps <html lang> in sync with next-intl when the document shell lives in app/layout.tsx */
export default function LocaleHtmlLang() {
  const locale = useLocale();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
