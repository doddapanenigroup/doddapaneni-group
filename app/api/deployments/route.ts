import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import { captureErrorToDb } from '@/lib/error-monitor';
import { hasDeveloperAccess } from '@/lib/role-utils';
import type { Role } from '@/lib/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_TAKE = 100;
const DEFAULT_TAKE = 40;

export async function GET(request: Request) {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  if (!session?.user?.id || !hasDeveloperAccess(role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const take = Math.min(
    MAX_TAKE,
    Math.max(1, Number.parseInt(url.searchParams.get('take') ?? String(DEFAULT_TAKE), 10) || DEFAULT_TAKE),
  );

  try {
    await connectDb();
    const rows = await prisma.deployment.findMany({
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        status: true,
        logs: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      items: rows.map((r) => ({
        id: r.id,
        status: r.status,
        logs: r.logs,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    await captureErrorToDb({ error: e, user: session.user, context: 'api/deployments' });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
