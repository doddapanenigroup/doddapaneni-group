import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import type { ContentEditLog, MarketingActivityLog } from '@/lib/prisma-generated';
import { captureErrorToDb } from '@/lib/error-monitor';
import type { Role } from '@/lib/constants';
import { isDashboardRole } from '@/lib/role-utils';

export async function GET() {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  if (!isDashboardRole(role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDb();
    const userId = session.user.id;

    const [edits, marketing] = await Promise.all([
      prisma.contentEditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.marketingActivityLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 40,
      }),
    ]);

    return NextResponse.json({
      role,
      contentEdits: (edits as ContentEditLog[]).map((e) => ({
        id: e.id,
        createdAt: e.createdAt.toISOString(),
        kind: e.kind,
        targetPath: e.targetPath,
        summary: e.summary,
      })),
      pageViews: [] as { path: string; visitedAt: string }[],
      marketingActivity: (marketing as MarketingActivityLog[]).map((m) => ({
        id: m.id,
        createdAt: m.createdAt.toISOString(),
        entity: m.entity,
        action: m.action,
        entityId: m.entityId,
        seoNote: m.seoNote,
        payloadJson: m.payloadJson,
      })),
    });
  } catch (error) {
    await captureErrorToDb({
      error,
      request: undefined,
      statusCode: 500,
      context: 'dashboard/my-activity/GET',
      user: session.user,
    });
    console.error('My activity error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
