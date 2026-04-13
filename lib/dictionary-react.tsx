'use client';

import React, { createContext, useContext, useMemo } from 'react';
import type { AppLocale } from '@/i18n/locales';
import { createTranslator, type TranslateValues } from '@/lib/translation-format';

type Messages = Record<string, unknown>;

const DictionaryContext = createContext<{
  locale: AppLocale;
  messages: Messages;
} | null>(null);

export function DictionaryProvider({
  locale,
  messages,
  children,
}: {
  locale: AppLocale;
  messages: Messages;
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ locale, messages }), [locale, messages]);
  return <DictionaryContext.Provider value={value}>{children}</DictionaryContext.Provider>;
}

export function useAppLocale(): AppLocale {
  const ctx = useContext(DictionaryContext);
  if (!ctx) {
    throw new Error('useAppLocale must be used within DictionaryProvider');
  }
  return ctx.locale;
}

/** Full messages object (same shape as JSON). */
export function useMessages(): Messages {
  const ctx = useContext(DictionaryContext);
  if (!ctx) {
    throw new Error('useMessages must be used within DictionaryProvider');
  }
  return ctx.messages;
}

/** Namespace-scoped translator (next-intl–compatible call shape). */
export function useTranslations(namespace?: string) {
  const { messages } = useContext(DictionaryContext)!;
  const t = useMemo(() => createTranslator(messages, namespace), [messages, namespace]);
  return (key: string, values?: TranslateValues) => t(key, values);
}
