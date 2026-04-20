import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import { formatInIST, formatInET } from '@/lib/date-timezones';
import { sendRoleCreatedEmailToCreator, sendRoleCreatedEmailToNewUser } from '@/lib/email';
import { verifyAdminEmployeeCreateOtp } from '@/lib/admin-employee-create-otp';
import bcrypt from 'bcryptjs';
import * as z from 'zod';
import type { Role } from '@/lib/constants';
import type { Role as DbRole } from '@/lib/prisma-generated';
import { captureErrorToDb } from '@/lib/error-monitor';
import { hasAdminAccess, isSuperAdmin } from '@/lib/role-utils';

const usernameSchema = z
  .string()
  .min(2, 'Username must be at least 2 characters')
  .max(48)
  .regex(/^[a-zA-Z0-9._-]+$/, 'Username: use letters, numbers, dot, underscore, hyphen only')
  .transform((s) => s.trim().toLowerCase());

const createOtpField = z
  .string()
  .transform((s) => s.replace(/\s/g, ''))
  .pipe(z.string().min(6, 'Enter the verification code').max(12));

const createUserSchemaAdmin = z.object({
  email: z.string().email(),
  username: usernameSchema,
  password: z.string().min(6),
  name: z.string().optional(),
  role: z.enum(['DEVELOPER', 'DIGITAL_MARKETER']),
  createOtp: createOtpField,
});

const createUserSchemaSuperAdmin = z.object({
  email: z.string().email(),
  username: usernameSchema,
  password: z.string().min(6),
  name: z.string().optional(),
  role: z.enum(['ADMIN', 'DEVELOPER', 'DIGITAL_MARKETER']),
  createOtp: createOtpField,
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    const role = session?.user?.role;
    const isSuperAdminUser = isSuperAdmin(role as any);
    if (!session?.user || !hasAdminAccess(role as any)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = isSuperAdminUser
      ? createUserSchemaSuperAdmin.safeParse(body)
      : createUserSchemaAdmin.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: parsed.error.issues },
        { status: 400 }
      );
    }

    const { email, username, password, name, role: newUserRole, createOtp } = parsed.data;
    const emailLower = email.trim().toLowerCase();
    const nameNorm = name?.trim() || null;

    await connectDb();
    const now = new Date();
    const pending = await prisma.adminEmployeeCreateOtp.findFirst({
      where: {
        adminUserId: session.user.id,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!pending || !verifyAdminEmployeeCreateOtp(pending.codeHash, session.user.id, createOtp)) {
      return NextResponse.json(
        { message: 'Invalid or expired verification code. Go back and request a new code.' },
        { status: 401 }
      );
    }

    if (
      pending.email !== emailLower ||
      pending.username !== username ||
      pending.role !== newUserRole ||
      (pending.name?.trim() || null) !== nameNorm ||
      !(await bcrypt.compare(password, pending.passwordHash))
    ) {
      return NextResponse.json(
        {
          message:
            'Details changed since the code was sent. Enter the same fields or request a new verification code.',
        },
        { status: 400 }
      );
    }

    const existingEmail = await prisma.user.findUnique({ where: { email: emailLower } });
    if (existingEmail) {
      return NextResponse.json(
        {
          message:
            'This email is already in use. Each account needs a different email.',
        },
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

    const createdAt = new Date();
    const doc = await prisma.$transaction(async (tx) => {
      await tx.adminEmployeeCreateOtp.deleteMany({ where: { id: pending.id } });
      return tx.user.create({
        data: {
          email: pending.email,
          username: pending.username,
          passwordHash: pending.passwordHash,
          name: pending.name,
          role: pending.role as DbRole,
          createdById: session.user.id,
          createdAtIST: formatInIST(createdAt),
          createdAtET: formatInET(createdAt),
        },
      });
    });

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
