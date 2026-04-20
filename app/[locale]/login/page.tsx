import LoginFormDynamic from './LoginFormDynamic';

/** Avoid stale HTML/JS for login after auth UI changes (password-only, no OTP). */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const raw = sp.callbackUrl;
  const callbackUrlFromServer = Array.isArray(raw) ? raw[0] : raw;

  return <LoginFormDynamic locale={locale} callbackUrlFromServer={callbackUrlFromServer ?? ''} />;
}
