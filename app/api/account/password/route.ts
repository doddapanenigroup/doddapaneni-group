import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import * as z from 'zod';
import { captureErrorToDb } from '@/lib/error-monitor';

const bodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

/**
 * Authenticated users can change their own password (bcrypt hash).
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: parsed.error.issues },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    await connectDb();
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) {
      return NextResponse.json({ message: 'Current password is incorrect' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash, passwordChangedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    await captureErrorToDb({
      error: e,
      request,
      statusCode: 500,
      context: 'account/password/POST',
      user: undefined,
    });
    console.error('[account/password]', e);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
