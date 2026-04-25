import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDb, prisma } from '@/lib/db';
import { captureErrorToDb } from '@/lib/error-monitor';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDb();
    const now = new Date();
    const r = await prisma.notification.updateMany({
      where: { userId: session.user.id, read: false },
      data: { read: true, readAt: now },
    });
    return NextResponse.json({ ok: true, updated: r.count });
  } catch (error) {
    await captureErrorToDb({
      error,
      request,
      statusCode: 500,
      user: session.user,
      context: 'notifications/mark-all-read/POST',
    });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
