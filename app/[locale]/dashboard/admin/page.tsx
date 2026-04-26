import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { publicPathForLocale } from '@/lib/public-path-with-locale';
import { connectDb, prisma } from '@/lib/db';
import type { Role } from '@/lib/constants';
import { canAccessAdminDashboard } from '@/lib/dashboard-access';
import AdminDashboard from '@/components/dashboard/AdminDashboard';

type Props = { params: Promise<{ locale: string }> };

type AdminUserRow = {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  role: string;
  createdAt: Date;
  createdAtIST: string | null;
  createdAtET: string | null;
};

function normalizeRole(raw: unknown): Role {
  const v = String(raw ?? '').trim().toUpperCase();
  if (v === 'SUPER_ADMIN') return 'ADMIN';
  if (v === 'ADMIN' || v === 'DEVELOPER' || v === 'DIGITAL_MARKETER' || v === 'HR') return v;
  return 'DEVELOPER';
}

export default async function AdminDashboardPage({ params }: Props) {
  const session = await auth();
  const { locale } = await params;

  if (!session?.user || !canAccessAdminDashboard(session.user.role as Role | null | undefined)) {
    redirect(publicPathForLocale(locale, '/dashboard'));
  }

  await connectDb();

  // Read via SQL to tolerate legacy role strings (e.g. `SUPER_ADMIN`) without crashing Prisma enum decoding.
  const userDocs = await prisma.$queryRaw<AdminUserRow[]>`
    SELECT
      id,
      email,
      username,
      name,
      role,
      created_at AS "createdAt",
      created_at_ist AS "createdAtIST",
      created_at_et AS "createdAtET"
    FROM User
    ORDER BY created_at DESC
  `;
  const users = userDocs.map((u) => ({
    id: u.id,
    email: u.email,
    username: u.username ?? null,
    name: u.name ?? null,
    role: normalizeRole(u.role),
    createdAt: u.createdAt,
    createdAtIST: u.createdAtIST ?? null,
    createdAtET: u.createdAtET ?? null,
  }));

  return (
    <AdminDashboard users={users} locale={locale} currentUserId={session.user.id} />
  );
}
