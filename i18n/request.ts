import {getRequestConfig} from 'next-intl/server';
import {routing} from './routing';
import divisionTopics from '../messages/division-topics.json';
import companyForms from '../messages/company-forms.json';

export default getRequestConfig(async ({requestLocale}) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;
  type AppLocale = (typeof routing.locales)[number];
  const isLocale = (l: string | undefined): l is AppLocale => !!l && routing.locales.includes(l as AppLocale);

  // Ensure that a valid locale is used
  if (!isLocale(locale)) {
    locale = routing.defaultLocale;
  }

  const localeMessages = (await import(`../messages/${locale}.json`)).default as Record<string, unknown>;
  const override = localeMessages.DivisionTopics as Record<string, unknown> | undefined;
  const companyFormsOverride = localeMessages.CompanyForms as Record<string, unknown> | undefined;

  return {
    locale,
    messages: {
      ...localeMessages,
      /** English copy lives in `messages/division-topics.json`; locales can override in their JSON. */
      DivisionTopics: {
        ...(divisionTopics as Record<string, unknown>),
        ...(override ?? {}),
      },
      /** Shared lead/contact copy; override per locale in `messages/{locale}.json` under `CompanyForms`. */
      CompanyForms: {
        ...(companyForms as Record<string, unknown>),
        ...(companyFormsOverride ?? {}),
      },
    },
    timeZone: 'Asia/Kolkata',
  };
});
