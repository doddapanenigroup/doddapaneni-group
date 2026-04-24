import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import type { Role } from '@/lib/constants';
import { hasAdminAccess } from '@/lib/role-utils';
import { publicPathForLocale } from '@/lib/public-path-with-locale';

type Props = { params: Promise<{ locale: string }> };

/** Legacy URL: admin UI lives at `/dashboard/admin`. */
export default async function SuperAdminDashboardRedirect({ params }: Props) {
  const session = await auth();
  const { locale } = await params;

  if (!session?.user) {
    redirect(publicPathForLocale(locale, '/login'));
  }
  if (hasAdminAccess(session.user.role as Role)) {
    redirect(publicPathForLocale(locale, '/dashboard/admin'));
  }
  redirect(publicPathForLocale(locale, '/dashboard'));
}
