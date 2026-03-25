import {getRequestConfig} from 'next-intl/server';
import {routing} from './routing';

export default getRequestConfig(async ({requestLocale}) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;
  type AppLocale = (typeof routing.locales)[number];
  const isLocale = (l: string | undefined): l is AppLocale => !!l && routing.locales.includes(l as AppLocale);

  // Ensure that a valid locale is used
  if (!isLocale(locale)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
