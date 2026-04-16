import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { connectDb, prisma } from '@/lib/db';
import { publicPathForLocale } from '@/lib/public-path-with-locale';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const session = await auth();
  const { locale } = await params;

  if (!session?.user) {
    const login = publicPathForLocale(locale, '/login');
    const dash = publicPathForLocale(locale, '/dashboard');
    redirect(`${login}?callbackUrl=${encodeURIComponent(dash)}`);
  }

  // Enforce admin "force logout" by comparing JWT issue time against DB revocation time.
  // This keeps security strong even with JWT sessions (no session table).
  try {
    await connectDb();
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { sessionRevokedAt: true },
    });
    const issuedAtMs =
      typeof session.user.sessionIssuedAt === 'number' ? session.user.sessionIssuedAt * 1000 : null;
    const revokedAtMs = dbUser?.sessionRevokedAt ? dbUser.sessionRevokedAt.getTime() : null;
    if (issuedAtMs != null && revokedAtMs != null && revokedAtMs > issuedAtMs) {
      const login = publicPathForLocale(locale, '/login');
      const dash = publicPathForLocale(locale, '/dashboard');
      redirect(`${login}?reason=revoked&callbackUrl=${encodeURIComponent(dash)}`);
    }
  } catch {
    // Best-effort: if DB is temporarily unavailable, do not block dashboard rendering here.
  }

  return (
    <DashboardShell user={session.user} locale={locale}>
      {children}
    </DashboardShell>
  );
}
