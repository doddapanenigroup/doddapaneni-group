import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import type { Role } from '@/lib/constants';
import { isAdmin, isDeveloper, isMarketer, isSuperAdmin } from '@/lib/role-utils';

export default async function DashboardPage() {
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  // Be defensive: session can exist but custom fields may be missing on some hosts/cookie races.
  const role = (session.user.role ?? 'DEVELOPER') as Role;

  if (isSuperAdmin(role)) redirect(`/${locale}/dashboard/super-admin`);
  if (isAdmin(role)) redirect(`/${locale}/dashboard/admin`);
  if (isDeveloper(role)) redirect(`/${locale}/dashboard/developer`);
  if (isMarketer(role)) redirect(`/${locale}/dashboard/marketer`);

  redirect(`/${locale}/dashboard/admin`);
}
