import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDb, prisma } from '@/lib/db';
import { formatInIST, formatInET } from '@/lib/date-timezones';
import { sendRoleCreatedEmailToCreator, sendRoleCreatedEmailToNewUser } from '@/lib/email';
import bcrypt from 'bcryptjs';
import * as z from 'zod';
import type { Role } from '@/lib/constants';
import type { Role as DbRole } from '@/lib/prisma-generated';
import { captureErrorToDb } from '@/lib/error-monitor';
import { hasAdminAccess } from '@/lib/role-utils';
import { notifyAdminsUserCreated } from '@/lib/notify';
import { resolveLibsqlDatabaseUrl } from '@/lib/resolve-libsql-database-url';

const usernameSchema = z
  .string()
  .min(2, 'Username must be at least 2 characters')
  .max(48)
  .regex(/^[a-zA-Z0-9._-]+$/, 'Username: use letters, numbers, dot, underscore, hyphen only')
  .transform((s) => s.trim().toLowerCase());

const createUserSchema = z.object({
  email: z.string().email(),
  username: usernameSchema,
  password: z.string().min(6),
  name: z.string().optional(),
  role: z.enum(['ADMIN', 'DEVELOPER', 'DIGITAL_MARKETER']),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    const role = session?.user?.role;
    if (!session?.user || !hasAdminAccess(role as any)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: 'Request body must be valid JSON' }, { status: 400 });
    }
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      const message =
        first?.path?.length && first.path.join('.')
          ? `${first.path.join('.')}: ${first.message}`
          : (first?.message ?? 'Invalid input');
      return NextResponse.json(
        { message, errors: parsed.error.issues },
        { status: 400 }
      );
    }

    const { email, username, password, name, role: newUserRole } = parsed.data;
    const emailLower = email.trim().toLowerCase();
    const nameNorm = name?.trim() || null;

    await connectDb();

    const existingEmail = await prisma.user.findUnique({ where: { email: emailLower } });
    if (existingEmail) {
      return NextResponse.json(
        { message: 'This email is already in use. Each account needs a different email.' },
        { status: 400 }
      );
    }
    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      return NextResponse.json(
        { message: 'This username is already taken. Choose another.' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const createdAt = new Date();

    const doc = await prisma.user.create({
      data: {
        email: emailLower,
        username,
        passwordHash,
        name: nameNorm,
        role: newUserRole as DbRole,
        createdById: session.user.id,
        createdAtIST: formatInIST(createdAt),
        createdAtET: formatInET(createdAt),
      },
    });

    if (process.env.NODE_ENV === 'development') {
      const raw = (process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL || '').trim();
      const label = raw.toLowerCase().startsWith('file:')
        ? resolveLibsqlDatabaseUrl(raw)
        : raw
          ? 'remote (libsql/https)'
          : '(unset)';
      console.info('[api/users] created', doc.email, '→ DB:', label);
    }

    const user = {
      id: doc.id,
      email: doc.email,
      username: doc.username ?? null,
      name: doc.name ?? null,
      role: doc.role as Role,
      createdAt: doc.createdAt,
      createdAtIST: doc.createdAtIST ?? null,
      createdAtET: doc.createdAtET ?? null,
    };

    const creatorEmail = session.user.email ?? '';
    const creatorName = session.user.name ?? null;
    const creatorRole = session.user.role ?? '';
    if (creatorEmail) {
      sendRoleCreatedEmailToCreator(creatorEmail, creatorRole, newUserRole, createdAt).catch(
        (err) => console.error('Role created email to creator failed:', err)
      );
    }
    sendRoleCreatedEmailToNewUser(
      doc.email,
      doc.name ?? null,
      newUserRole,
      creatorRole,
      creatorName,
      createdAt,
      password
    ).catch((err) => console.error('Role created email to new user failed:', err));

    void notifyAdminsUserCreated({
      newUserEmail: doc.email,
      newUserRole: newUserRole,
      createdByEmail: session.user.email ?? null,
      excludeUserId: session.user.id,
    });

    return NextResponse.json({ user });
  } catch (error) {
    await captureErrorToDb({
      error,
      request,
      statusCode: 500,
      context: 'users/POST',
      user: null,
    });
    console.error('Create user error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
