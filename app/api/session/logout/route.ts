import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import { formatInIST, formatInET } from '@/lib/date-timezones';
import { recordApiRequest } from '@/lib/request-monitor';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    recordApiRequest({ request, userId: session.user.id });
    await connectDb();
    const latest = await prisma.loginLog.findFirst({
      where: { userId: session.user.id, loggedOutAt: null },
      orderBy: { loggedAt: 'desc' },
    });

    if (latest) {
      const out = new Date();
      await prisma.loginLog.update({
        where: { id: latest.id },
        data: {
          loggedOutAt: out,
          loggedOutAtIST: formatInIST(out),
          loggedOutAtET: formatInET(out),
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Session logout error:', error);
    return NextResponse.json({ message: 'Failed to record logout' }, { status: 500 });
  }
}
