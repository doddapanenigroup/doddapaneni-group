import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import { captureErrorToDb } from '@/lib/error-monitor';

export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 40;
const MAX_LIMIT = 80;

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const raw = Number(url.searchParams.get('limit'));
  const limit = Number.isFinite(raw)
    ? Math.min(MAX_LIMIT, Math.max(1, Math.floor(raw)))
    : DEFAULT_LIMIT;

  try {
    await connectDb();
    const userId = session.user.id;

    const [items, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          type: true,
          title: true,
          body: true,
          linkHref: true,
          readAt: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({
        where: { userId, readAt: null },
      }),
    ]);

    return NextResponse.json({
      unreadCount,
      items: items.map((n) => ({
        ...n,
        readAt: n.readAt ? n.readAt.toISOString() : null,
        createdAt: n.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    await captureErrorToDb({
      error,
      request,
      statusCode: 500,
      user: session.user,
      context: 'notifications/GET',
    });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
