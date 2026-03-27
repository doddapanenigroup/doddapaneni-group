import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectDb, prisma } from '@/lib/db';
import { formatInIST, formatInET } from '@/lib/date-timezones';
import { getUserByLoginIdentifier } from '@/lib/get-user-for-login';
import { verifyLoginEmailOtpCode } from '@/lib/login-email-otp';
import { shouldSendLoginSuccessEmail, sendLoginSuccessEmail } from '@/lib/email';
import type { Role } from '@/lib/constants';

// Validate required env vars at startup
if (!process.env.AUTH_SECRET) {
  throw new Error('AUTH_SECRET environment variable is required');
}

const AUTH_DEBUG = process.env.AUTH_DEBUG === '1' || process.env.AUTH_DEBUG === 'true';

const nextAuth = NextAuth({
  // Hostinger runs behind a reverse proxy; Auth.js often needs this to avoid
  // "There was a problem with the server configuration" / ClientFetchError.
  trustHost: true,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        login: { label: 'Email or username', type: 'text' },
        password: { label: 'Password', type: 'password' },
        emailOtp: { label: 'Email verification code', type: 'text' },
      },
      async authorize(credentials) {
        const login = String(credentials?.login ?? '').trim();
        if (!login || !credentials?.password) return null;
        const password = String(credentials.password).trim();
        if (!password) return null;

        const emailOtpRaw =
          credentials.emailOtp != null ? String(credentials.emailOtp).replace(/\s/g, '') : '';
        if (!emailOtpRaw || emailOtpRaw.length < 6) return null;

        try {
          const user = await getUserByLoginIdentifier(login);
          if (!user?.passwordHash) return null;
          const ok = await bcrypt.compare(password, user.passwordHash);
          if (!ok) return null;

          await connectDb();

          const now = new Date();
          const row = await prisma.loginEmailOtp.findFirst({
            where: {
              userId: user.id,
              expiresAt: { gt: now },
            },
            orderBy: { createdAt: 'desc' },
          });
          if (!row || !verifyLoginEmailOtpCode(row.codeHash, user.id, emailOtpRaw)) {
            return null;
          }

          if (AUTH_DEBUG) {
            console.info('[auth-debug] otp-verified', { userId: user.id, at: now.toISOString() });
          }

          await prisma.loginEmailOtp.deleteMany({ where: { userId: user.id } });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role as Role,
          };
        } catch (err) {
          console.error('[auth] authorize failed (check DB connection and that user exists):', err);
          // Do not throw: NextAuth surfaces thrown errors as HTTP 500 on sign-in.
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Token is typed from Auth.js. Custom fields are provided via module augmentation above.
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? '';
        session.user.email = token.email ?? '';
        session.user.name = token.name ?? null;
        session.user.role = (token.role ?? 'DEVELOPER') as Role;
        session.user.sessionIssuedAt = typeof token.iat === 'number' ? token.iat : undefined;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (!user?.id) return;
      try {
        await connectDb();
        const loggedAt = new Date();
        await prisma.loginLog.create({
          data: {
            userId: user.id,
            loggedAt,
            loggedAtIST: formatInIST(loggedAt),
            loggedAtET: formatInET(loggedAt),
          },
        });
      } catch (err) {
        console.error('LoginLog create failed (login still succeeded):', err);
      }
      if (user?.email && user?.role && shouldSendLoginSuccessEmail(user.role)) {
        sendLoginSuccessEmail(user.email, user.name ?? null, user.role).catch((err) =>
          console.error('Login success email failed:', err)
        );
      }
    },
  },
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.AUTH_SECRET,
});

export const { handlers, signIn, signOut, auth } = nextAuth;

/**
 * Server-side session for Route Handlers and Server Components.
 * Auth.js v5 uses `auth()` under the hood (replaces NextAuth v4 `getServerSession`).
 */
export async function getServerSession() {
  return auth();
}
