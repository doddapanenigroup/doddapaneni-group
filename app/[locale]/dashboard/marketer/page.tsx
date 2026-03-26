import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import MarketerDashboard from '@/components/dashboard/MarketerDashboard';

export default async function MarketerDashboardPage() {
  const session = await auth();
  const locale = await getLocale();

  const role = session?.user?.role;
  const canAccess =
    role === 'DIGITAL_MARKETER' || role === 'ADMIN' || role === 'SUPER_ADMIN';
  if (!session?.user || !canAccess) {
    redirect(`/${locale}/dashboard`);
  }

  return <MarketerDashboard locale={locale} />;
}
