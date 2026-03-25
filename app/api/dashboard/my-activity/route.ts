import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import type {
  ContentEditLog,
  DeveloperPageView,
  MarketingActivityLog,
} from '@/lib/prisma-generated';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const role = session.user.role;
  if (role !== 'DEVELOPER' && role !== 'DIGITAL_MARKETER') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDb();
    const userId = session.user.id;

    if (role === 'DEVELOPER') {
      const [edits, pageViews] = await Promise.all([
        prisma.contentEditLog.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 30,
        }),
        prisma.developerPageView.findMany({
          where: { userId },
          orderBy: { visitedAt: 'desc' },
          take: 30,
        }),
      ]);
      return NextResponse.json({
        role: 'DEVELOPER',
        contentEdits: (edits as ContentEditLog[]).map((e) => ({
          id: e.id,
          createdAt: e.createdAt.toISOString(),
          kind: e.kind,
          targetPath: e.targetPath,
          summary: e.summary,
        })),
        pageViews: (pageViews as DeveloperPageView[]).map((p) => ({
          path: p.path,
          visitedAt: p.visitedAt.toISOString(),
        })),
      });
    }

    const marketing = await prisma.marketingActivityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 40,
    });
    return NextResponse.json({
      role: 'DIGITAL_MARKETER',
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
    console.error('My activity error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
