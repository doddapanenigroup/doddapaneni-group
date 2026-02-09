import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import "../globals.css";
import LayoutWithNav from "../../components/LayoutWithNav";
import Providers from "@/components/Providers";
import {NextIntlClientProvider} from 'next-intl';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import {messagesByLocale} from '@/lib/messages';

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({locale, namespace: 'Metadata'});
 
  return {
    title: t('title'),
    description: t('description'),
    icons: {
      icon: '/logo.png',
      apple: '/logo.png',
    },
    other: { google: 'notranslate' },
  };
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: paramLocale } = await params;
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? '';
  // Prefer route param (from URL segment); fallback to pathname so /hi/blog and /es/blog get correct locale
  const fromPath = pathname.split('/').filter(Boolean)[0];
  const locale =
    routing.locales.includes(paramLocale as any) ? paramLocale
    : fromPath && routing.locales.includes(fromPath as any) ? fromPath
    : routing.defaultLocale;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = messagesByLocale[locale] ?? messagesByLocale.en;

  return (
    <html lang={locale}>
      <body className={`${inter.className} antialiased min-h-screen flex flex-col`}>
        <Providers>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <LayoutWithNav initialPathname={pathname}>{children}</LayoutWithNav>
          </NextIntlClientProvider>
        </Providers>
      </body>
    </html>
  );
}
