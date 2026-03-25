import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import * as z from 'zod';
import type { Role as DbRole } from '@/lib/prisma-generated';
import {
  adminEmployeeCreateOtpExpiresAt,
  generateAdminEmployeeCreateOtpCode,
  hashAdminEmployeeCreateOtp,
} from '@/lib/admin-employee-create-otp';
import { isLoginEmailDeliveryConfigured, sendAdminEmployeeCreateOtpEmail } from '@/lib/email';

const usernameSchema = z
  .string()
  .min(2, 'Username must be at least 2 characters')
  .max(48)
  .regex(/^[a-zA-Z0-9._-]+$/, 'Username: use letters, numbers, dot, underscore, hyphen only')
  .transform((s) => s.trim().toLowerCase());

const bodySchemaAdmin = z.object({
  email: z.string().email(),
  username: usernameSchema,
  password: z.string().min(6),
  name: z.string().optional(),
  role: z.enum(['DEVELOPER', 'DIGITAL_MARKETER']),
});

const bodySchemaSuperAdmin = z.object({
  email: z.string().email(),
  username: usernameSchema,
  password: z.string().min(6),
  name: z.string().optional(),
  role: z.enum(['ADMIN', 'DEVELOPER', 'DIGITAL_MARKETER']),
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Exported role labels for email — avoid importing private ROLE_LABEL from email.ts */
const ROLE_LABEL_LOCAL: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  DEVELOPER: 'Developer',
  DIGITAL_MARKETER: 'Digital Marketer',
};

export async function POST(request: Request) {
  try {
    if (!isLoginEmailDeliveryConfigured()) {
      return NextResponse.json(
        {
          message:
            'Email is not configured. Set EMAIL_USER and EMAIL_PASS (Gmail app password) or SMTP, then restart the server.',
        },
        { status: 503 }
      );
    }

    const session = await auth();
    const role = session?.user?.role;
    const isSuperAdmin = role === 'SUPER_ADMIN';
    const isAdmin = role === 'ADMIN';
    if (!session?.user?.id || (!isSuperAdmin && !isAdmin)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const adminEmail = session.user.email?.trim();
    if (!adminEmail) {
      return NextResponse.json(
        { message: 'Your account has no email; cannot send verification code.' },
        { status: 400 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = isSuperAdmin
      ? bodySchemaSuperAdmin.safeParse(body)
      : bodySchemaAdmin.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: parsed.error.issues },
        { status: 400 }
      );
    }

    const { email, username, password, name, role: newUserRole } = parsed.data;
    const emailLower = email.trim().toLowerCase();

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
    const code = generateAdminEmployeeCreateOtpCode();
    const codeHash = hashAdminEmployeeCreateOtp(session.user.id, code);
    const expiresAt = adminEmployeeCreateOtpExpiresAt();

    // Array $transaction avoids interactive `tx` (can break under Turbopack with custom Prisma output).
    await prisma.$transaction([
      prisma.adminEmployeeCreateOtp.deleteMany({ where: { adminUserId: session.user.id } }),
      prisma.adminEmployeeCreateOtp.create({
        data: {
          adminUserId: session.user.id,
          codeHash,
          expiresAt,
          email: emailLower,
          username,
          passwordHash,
          name: name?.trim() || null,
          role: newUserRole as DbRole,
        },
      }),
    ]);

    const roleLabel = ROLE_LABEL_LOCAL[newUserRole] ?? newUserRole;

    try {
      await sendAdminEmployeeCreateOtpEmail(
        adminEmail,
        session.user.name ?? null,
        emailLower,
        username,
        roleLabel,
        code
      );
    } catch (err) {
      console.error('[create-employee-otp] send mail failed:', err);
      await prisma.adminEmployeeCreateOtp.deleteMany({ where: { adminUserId: session.user.id } });
      const detail = err instanceof Error ? err.message : String(err);
      const devHint = process.env.NODE_ENV === 'development' ? ` ${detail.slice(0, 200)}` : '';
      return NextResponse.json(
        { message: `Could not send verification email.${devHint}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, codeSentTo: adminEmail });
  } catch (e) {
    console.error('[create-employee-otp]', e);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
