import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import AnalyticsDashboard from '@/components/dashboard/AnalyticsDashboard';

export default async function AnalyticsPage() {
  const session = await auth();
  const locale = await getLocale();

  const role = session?.user?.role;
  const allowed =
    role === 'ADMIN' ||
    role === 'SUPER_ADMIN' ||
    role === 'DIGITAL_MARKETER';

  if (!session?.user || !allowed) {
    redirect(`/${locale}/dashboard`);
  }

  return <AnalyticsDashboard locale={locale} />;
}
