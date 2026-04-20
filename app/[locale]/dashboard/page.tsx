import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import type { Role } from '@/lib/constants';
import { hasAdminAccess, isDeveloper, isMarketer } from '@/lib/role-utils';
import { publicPathForLocale } from '@/lib/public-path-with-locale';

type Props = { params: Promise<{ locale: string }> };

export default async function DashboardPage({ params }: Props) {
  const session = await auth();
  const { locale } = await params;

  if (!session?.user) {
    redirect(publicPathForLocale(locale, '/login'));
  }

  // Be defensive: session can exist but custom fields may be missing on some hosts/cookie races.
  const role = (session.user.role ?? 'DEVELOPER') as Role;

  if (hasAdminAccess(role)) redirect(publicPathForLocale(locale, '/dashboard/admin'));
  if (isDeveloper(role)) redirect(publicPathForLocale(locale, '/dashboard/developer'));
  if (isMarketer(role)) redirect(publicPathForLocale(locale, '/dashboard/marketer'));

  redirect(publicPathForLocale(locale, '/dashboard/admin'));
}
