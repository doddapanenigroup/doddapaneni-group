import SecuritySettingsClient from './SecuritySettingsClient';

export default async function SecurityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <SecuritySettingsClient locale={locale} />;
}
