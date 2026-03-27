import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { connectDb, prisma } from '@/lib/db';
import type { Role } from '@/lib/constants';
import { canAccessSuperAdminDashboard } from '@/lib/dashboard-access';
import type { User as DbUser } from '@/lib/prisma-generated';
import SuperAdminDashboard from '@/components/dashboard/SuperAdminDashboard';

export default async function SuperAdminDashboardPage() {
  const session = await auth();
  const locale = await getLocale();

  if (
    !session?.user ||
    !canAccessSuperAdminDashboard(session.user.role as Role | null | undefined)
  ) {
    redirect(`/${locale}/dashboard`);
  }

  await connectDb();

  const userDocs = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  });
  const users = userDocs.map((u: DbUser) => ({
    id: u.id,
    email: u.email,
    username: u.username ?? null,
    name: u.name ?? null,
    role: u.role as Role,
    createdAt: u.createdAt,
    createdAtIST: u.createdAtIST ?? null,
    createdAtET: u.createdAtET ?? null,
  }));

  return (
    <SuperAdminDashboard
      users={users}
      locale={locale}
      currentUserId={session.user.id}
      viewerRole={session.user.role as Role}
    />
  );
}
