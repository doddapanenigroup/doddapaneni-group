import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { publicPathForLocale } from '@/lib/public-path-with-locale';
import type { Role } from '@/lib/constants';
import { hasMarketerAccess } from '@/lib/role-utils';

type Props = { params: Promise<{ locale: string }> };

/** Legacy URL: traffic analytics were removed; send marketers to the main marketing dashboard. */
export default async function AnalyticsPageRedirect({ params }: Props) {
  const session = await auth();
  const { locale } = await params;
  const role = session?.user?.role;

  if (!session?.user || !hasMarketerAccess(role as Role | null | undefined)) {
    redirect(publicPathForLocale(locale, '/dashboard'));
  }

  redirect(publicPathForLocale(locale, '/dashboard/marketer'));
}
