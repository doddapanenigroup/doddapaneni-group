import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import { formatInIST, formatInET } from '@/lib/date-timezones';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== 'DEVELOPER') {
    return NextResponse.json({ message: 'For developers only' }, { status: 403 });
  }

  let path: string;
  try {
    const body = await request.json();
    path = typeof body?.path === 'string' ? body.path.trim() : '';
  } catch {
    path = '';
  }
  if (!path) {
    return NextResponse.json({ message: 'path required' }, { status: 400 });
  }

  try {
    await connectDb();

    const currentSession = await prisma.loginLog.findFirst({
      where: { userId: session.user.id, loggedOutAt: null },
      orderBy: { loggedAt: 'desc' },
    });

    if (!currentSession) {
      return NextResponse.json({ message: 'No active session' }, { status: 400 });
    }

    const visitedAt = new Date();
    await prisma.developerPageView.create({
      data: {
        userId: session.user.id,
        loginLogId: currentSession.id,
        path,
        visitedAt,
        visitedAtIST: formatInIST(visitedAt),
        visitedAtET: formatInET(visitedAt),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Developer activity error:', error);
    return NextResponse.json({ message: 'Failed to record activity' }, { status: 500 });
  }
}
