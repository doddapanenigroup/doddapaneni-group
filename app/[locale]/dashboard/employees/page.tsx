import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { connectDb, prisma } from '@/lib/db';
import type { Role } from '@/lib/constants';
import { canAccessEmployeesDashboard } from '@/lib/dashboard-access';
import type { LoginLog, Role as PrismaRole, User as DbUser } from '@/lib/prisma-generated';
import { getRoleOrder } from '@/lib/constants';
import EmployeesPageView from '../../../../components/dashboard/EmployeesPageView';
import { publicPathForLocale } from '@/lib/public-path-with-locale';

type EmployeeSession = {
  logId: string;
  loggedAt: string;
  loggedOutAt: string | null;
  timeOnlineMinutes: number;
  pageViews: { path: string; visitedAt: string }[];
};

type EmployeeWithStats = {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  role: Role;
  sessions: EmployeeSession[];
  isActive: boolean;
};

type Props = { params: Promise<{ locale: string }> };

export default async function EmployeesPage({ params }: Props) {
  const session = await auth();
  const { locale } = await params;

  const role = session?.user?.role;
  if (!session?.user || !canAccessEmployeesDashboard(role as Role | null | undefined)) {
    redirect(publicPathForLocale(locale, '/dashboard'));
  }

  const employeeRoles: Role[] = ['ADMIN', 'DEVELOPER', 'DIGITAL_MARKETER'];

  await connectDb();

  const userDocs = await prisma.user.findMany({
    where: { role: { in: employeeRoles as PrismaRole[] } },
    orderBy: [{ name: 'asc' }, { email: 'asc' }],
  });
  const userIds = userDocs.map((u: DbUser) => u.id);

  const loginLogDocs = await prisma.loginLog.findMany({
    where: { userId: { in: userIds } },
    orderBy: { loggedAt: 'desc' },
    take: 200,
  });

  const logsByUserId = loginLogDocs.reduce(
    (acc: Record<string, EmployeeSession[]>, log: LoginLog) => {
      const uid = String(log.userId);
      if (!acc[uid]) acc[uid] = [];
      const end = log.loggedOutAt ? new Date(log.loggedOutAt).getTime() : Date.now();
      const start = new Date(log.loggedAt).getTime();
      const timeOnlineMinutes = Math.round((end - start) / 60000);
      acc[uid].push({
        logId: log.id,
        loggedAt: log.loggedAt.toISOString(),
        loggedOutAt: log.loggedOutAt ? log.loggedOutAt.toISOString() : null,
        timeOnlineMinutes,
        pageViews: [] as { path: string; visitedAt: string }[],
      });
      return acc;
    },
    {} as Record<string, EmployeeSession[]>
  );

  const ACTIVE_SESSION_MAX_AGE_MS = 60 * 60 * 1000;
  const now = Date.now();
  const employees: EmployeeWithStats[] = userDocs
    .map((u: DbUser) => {
      const sessions = logsByUserId[u.id] ?? [];
      const isActive = sessions.some(
        (s: EmployeeSession) =>
          s.loggedOutAt === null &&
          now - new Date(s.loggedAt).getTime() < ACTIVE_SESSION_MAX_AGE_MS
      );
      return {
        id: u.id,
        email: u.email,
        username: u.username ?? null,
        name: u.name ?? null,
        role: u.role as Role,
        sessions,
        isActive,
      };
    })
    .sort(
      (a: EmployeeWithStats, b: EmployeeWithStats) =>
        getRoleOrder(a.role) - getRoleOrder(b.role) ||
        (a.name || a.email).localeCompare(b.name || b.email)
    );

  const dashboardHref = publicPathForLocale(locale, '/dashboard/admin');

  return (
    <EmployeesPageView
      employees={employees}
      locale={locale}
      dashboardHref={dashboardHref}
    />
  );
}
