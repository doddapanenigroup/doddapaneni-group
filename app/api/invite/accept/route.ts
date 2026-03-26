import { NextResponse } from 'next/server';
import * as z from 'zod';
import bcrypt from 'bcryptjs';
import { connectDb, prisma } from '@/lib/db';
import { captureErrorToDb } from '@/lib/error-monitor';
import { verifyInviteToken } from '@/lib/user-invite-token';

const bodySchema = z.object({
  email: z.string().email(),
  token: z.string().min(10),
  password: z.string().min(6),
  name: z.string().max(120).optional(),
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const raw = (await request.json().catch(() => null)) as unknown;
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid input', errors: parsed.error.issues }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const token = parsed.data.token.trim();
    const password = parsed.data.password;
    const name = parsed.data.name?.trim() || null;

    await connectDb();

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: 'Account already exists. Please log in.' }, { status: 400 });
    }

    const now = new Date();
    const invite = await prisma.userInvite.findFirst({
      where: { email, usedAt: null, expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
    });

    if (!invite || !verifyInviteToken(invite.tokenHash, email, token)) {
      return NextResponse.json({ message: 'Invite link is invalid or expired.' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          email,
          username: null,
          passwordHash,
          name,
          role: invite.role,
        },
      });
      await tx.userInvite.update({ where: { id: invite.id }, data: { usedAt: now } });
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    await captureErrorToDb({ error: err, request, statusCode: 500, user: null, context: 'invite accept' });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

