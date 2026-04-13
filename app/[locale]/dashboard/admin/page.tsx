import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { connectDb, prisma } from '@/lib/db';
import type { Role } from '@/lib/constants';
import { canAccessAdminDashboard } from '@/lib/dashboard-access';
import type { User as DbUser } from '@/lib/prisma-generated';
import AdminDashboard from '@/components/dashboard/AdminDashboard';

type Props = { params: Promise<{ locale: string }> };

export default async function AdminDashboardPage({ params }: Props) {
  const session = await auth();
  const { locale } = await params;

  if (!session?.user || !canAccessAdminDashboard(session.user.role as Role | null | undefined)) {
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
    <AdminDashboard
      users={users}
      locale={locale}
      currentUserId={session.user.id}
      viewerRole={session.user.role as Role}
    />
  );
}
