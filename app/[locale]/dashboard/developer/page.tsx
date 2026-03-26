import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import DeveloperDashboard from '@/components/dashboard/DeveloperDashboard';

export default async function DeveloperDashboardPage() {
  const session = await auth();
  const locale = await getLocale();

  const role = session?.user?.role;
  if (!session?.user || (role !== 'DEVELOPER' && role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
    redirect(`/${locale}/dashboard`);
  }

  return <DeveloperDashboard locale={locale} viewerRole={role} />;
}
