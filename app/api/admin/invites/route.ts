import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import { captureErrorToDb } from '@/lib/error-monitor';
import { isLoginEmailDeliveryConfigured, sendUserInviteEmail } from '@/lib/email';
import { generateInviteToken, hashInviteToken, inviteExpiresAt } from '@/lib/user-invite-token';
import * as z from 'zod';
import { hasAdminAccess } from '@/lib/role-utils';
import { publicPathForLocale } from '@/lib/public-path-with-locale';
const bodySchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'DEVELOPER', 'DIGITAL_MARKETER']),
  expiresInHours: z.number().int().min(1).max(168).optional(), // up to 7 days
  locale: z.enum(['en', 'te', 'hi', 'es']).optional(),
});

function isAdminRole(role: unknown) {
  return hasAdminAccess(role as any);
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Admin',
  DEVELOPER: 'Developer',
  DIGITAL_MARKETER: 'Digital Marketer',
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await auth();
  const requesterRole = (session as { user?: { role?: string } } | null | undefined)?.user?.role;
  if (!session?.user?.id || !isAdminRole(requesterRole)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  if (!isLoginEmailDeliveryConfigured()) {
    return NextResponse.json(
      {
        message:
          'Email is not configured. Set EMAIL_USER and EMAIL_PASS (Gmail app password) or SMTP, then restart the server.',
      },
      { status: 503 }
    );
  }

  try {
    const raw = (await request.json().catch(() => null)) as unknown;
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid input', errors: parsed.error.issues }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const locale = (parsed.data.locale ?? 'en').trim();
    const expiresInHours = parsed.data.expiresInHours ?? 48;
    const ttlMs = expiresInHours * 60 * 60 * 1000;

    await connectDb();

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: 'This email already has an account.' }, { status: 400 });
    }

    const token = generateInviteToken();
    const tokenHash = hashInviteToken(email, token);
    const expiresAt = inviteExpiresAt(ttlMs);

    // Replace any previous unused invites for this email.
    const invite = await prisma.$transaction(async (tx) => {
      await tx.userInvite.updateMany({
        where: { email, usedAt: null },
        data: { usedAt: new Date() },
      });
      return await tx.userInvite.create({
        data: {
          email,
          role: parsed.data.role,
          tokenHash,
          invitedById: session.user.id,
          expiresAt,
        },
        select: { id: true, email: true, role: true, expiresAt: true },
      });
    });

    const baseUrl =
      process.env.NEXTAUTH_URL?.trim() || process.env.AUTH_URL?.trim() || 'http://localhost:3000';
    const invitePath = publicPathForLocale(locale, '/invite');
    const inviteUrl = `${baseUrl.replace(/\/$/, '')}${invitePath}?email=${encodeURIComponent(
      email,
    )}&token=${encodeURIComponent(token)}`;

    const roleLabel = ROLE_LABEL[invite.role] ?? String(invite.role);

    await sendUserInviteEmail({
      to: email,
      invitedByEmail: session.user.email ?? 'admin',
      invitedByName: session.user.name ?? null,
      roleLabel,
      inviteUrl,
      expiresInHours,
    });

    return NextResponse.json({
      ok: true,
      invite: { id: invite.id, email: invite.email, role: invite.role, expiresAt: invite.expiresAt.toISOString() },
    });
  } catch (err) {
    await captureErrorToDb({
      error: err,
      request,
      statusCode: 500,
      user: { id: session.user.id, email: session.user.email ?? null, role: requesterRole ?? null },
      context: 'admin invites create',
    });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

