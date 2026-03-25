import LoginFormDynamic from './LoginFormDynamic';

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
