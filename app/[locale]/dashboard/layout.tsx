import { auth } from '@/lib/auth';
import { unstable_noStore } from 'next/cache';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { connectDb, prisma } from '@/lib/db';
import { publicPathForLocale } from '@/lib/public-path-with-locale';
import type { Role } from '@/lib/constants';
import { normalizeUserRoleFromDb } from '@/lib/admin-dashboard-users';

/** Session + DB-backed shell must not be served from a shared static shell. */
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  unstable_noStore();
  const session = await auth();
  const { locale } = await params;

  if (!session?.user) {
    const login = publicPathForLocale(locale, '/login');
    const dash = publicPathForLocale(locale, '/dashboard');
    redirect(`${login}?callbackUrl=${encodeURIComponent(dash)}`);
  }

  /** One DB read: session revocation + fresh profile for header (avoids duplicate round-trips per navigation). */
  let shellUser: {
    email: string;
    name: string | null;
    username: string | null;
    role: Role;
  } = {
    email: session.user.email,
    name: session.user.name,
    username: null,
    role: session.user.role as Role,
  };
  try {
    await connectDb();
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        sessionRevokedAt: true,
        email: true,
        name: true,
        username: true,
        role: true,
      },
    });
    if (dbUser) {
      shellUser = {
        email: dbUser.email,
        name: dbUser.name,
        username: dbUser.username,
        role: normalizeUserRoleFromDb(dbUser.role),
      };
      const issuedAtMs =
        typeof session.user.sessionIssuedAt === 'number' ? session.user.sessionIssuedAt * 1000 : null;
      const revokedAtMs = dbUser.sessionRevokedAt ? dbUser.sessionRevokedAt.getTime() : null;
      if (issuedAtMs != null && revokedAtMs != null && revokedAtMs > issuedAtMs) {
        const login = publicPathForLocale(locale, '/login');
        const dash = publicPathForLocale(locale, '/dashboard');
        redirect(`${login}?reason=revoked&callbackUrl=${encodeURIComponent(dash)}`);
      }
    }
  } catch {
    // Best-effort: if DB is temporarily unavailable, keep session-backed shellUser and skip revocation check.
  }

  return (
    <DashboardShell user={shellUser} locale={locale}>
      {children}
    </DashboardShell>
  );
}
