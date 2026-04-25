import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectDb, prisma } from '@/lib/db';
import { formatInIST, formatInET } from '@/lib/date-timezones';
import { getUserByLoginIdentifier } from '@/lib/get-user-for-login';
import { shouldSendLoginSuccessEmail, sendLoginSuccessEmail } from '@/lib/email';
import type { Role } from '@/lib/constants';

// Validate required env vars at startup
if (!process.env.AUTH_SECRET) {
  throw new Error('AUTH_SECRET environment variable is required');
}

const AUTH_DEBUG = process.env.AUTH_DEBUG === '1' || process.env.AUTH_DEBUG === 'true';

function normalizeRole(input: unknown): Role {
  const raw = String(input ?? '').trim().toUpperCase();
  // Backward compatibility for rows/token values created before role merge.
  if (raw === 'SUPER_ADMIN') return 'ADMIN';
  if (raw === 'ADMIN' || raw === 'DEVELOPER' || raw === 'DIGITAL_MARKETER') {
    return raw;
  }
  return 'DEVELOPER';
}

const nextAuth = NextAuth({
  /**
   * Required on self‑hosted production (e.g. DigitalOcean, Hostinger) where `NODE_ENV === "production"`
   * and you are not on Vercel/Cloudflare Pages. Without this, Auth.js treats the request host as
   * untrusted and `/api/auth/session` returns 500 (AuthError / “server configuration”).
   * @see https://authjs.dev/reference/core#trusthost
   */
  trustHost: true,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        login: { label: 'Email or username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const login = String(credentials?.login ?? '').trim();
        if (!login || !credentials?.password) return null;
        const password = String(credentials.password).trim();
        if (!password) return null;

        try {
          const user = await getUserByLoginIdentifier(login);
          if (!user?.passwordHash) return null;
          const ok = await bcrypt.compare(password, user.passwordHash);
          if (!ok) return null;

          if (AUTH_DEBUG) {
            console.info('[auth-debug] password-sign-in', { userId: user.id });
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: normalizeRole(user.role),
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
        session.user.id = typeof token.id === 'string' ? token.id : '';
        session.user.email = typeof token.email === 'string' ? token.email : '';
        session.user.name = typeof token.name === 'string' ? token.name : null;
        session.user.role = normalizeRole(token.role);
        session.user.sessionIssuedAt = typeof token.iat === 'number' ? token.iat : undefined;

        // JWT fields are fixed at sign-in; merge latest profile from DB so dashboard + header
        // stay in sync when names/roles are updated in the database (or by another admin).
        if (session.user.id) {
          try {
            await connectDb();
            const rows = await prisma.$queryRaw<Array<{ email: string; name: string | null; role: string }>>`
              SELECT email, name, role
              FROM User
              WHERE id = ${session.user.id}
              LIMIT 1
            `;
            const fresh = rows[0];
            if (fresh) {
              session.user.email = fresh.email;
              session.user.name = fresh.name;
              session.user.role = normalizeRole(fresh.role);
            }
          } catch {
            // Keep token-backed values if the database is unavailable.
          }
        }
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

/** Use `await auth()` in Server Components, Route Handlers, and server actions. */
export const { handlers, signIn, signOut, auth } = nextAuth;
