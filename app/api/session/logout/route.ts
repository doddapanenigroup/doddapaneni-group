import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDb, prisma } from '@/lib/db';
import { formatInIST, formatInET } from '@/lib/date-timezones';
import { recordApiRequest } from '@/lib/request-monitor';

/**
 * Use `auth((req) => ...)` so the session is resolved from the incoming request.
 * `await auth()` with no args uses `headers()` (RSC path) and is unreliable in Route
 * Handlers, which can yield no session and 401 until a second try.
 */
export const POST = auth(async (req) => {
  const userId = req.auth?.user?.id;
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    recordApiRequest({ request: req, userId });
    await connectDb();
    const latest = await prisma.loginLog.findFirst({
      where: { userId, loggedOutAt: null },
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
});
