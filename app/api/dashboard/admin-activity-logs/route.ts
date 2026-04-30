import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDb, prisma } from '@/lib/db';
import { captureErrorToDb } from '@/lib/error-monitor';
import { hasAdminAccess } from '@/lib/role-utils';
import type { ContentEditLog, MarketingActivityLog, Role } from '@/lib/prisma-generated';

const PAGE_SIZE_DEFAULT = 50;
const PAGE_SIZE_MAX = 100;

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = session?.user?.role;

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  if (!hasAdminAccess(role as Role | null | undefined)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const kind = req.nextUrl.searchParams.get('kind');
  const pageRaw = req.nextUrl.searchParams.get('page');
  const pageSizeRaw = req.nextUrl.searchParams.get('pageSize');

  const page = Math.max(1, Number.parseInt(pageRaw ?? '1', 10) || 1);
  let pageSize = Number.parseInt(pageSizeRaw ?? String(PAGE_SIZE_DEFAULT), 10) || PAGE_SIZE_DEFAULT;
  pageSize = Math.min(PAGE_SIZE_MAX, Math.max(1, pageSize));
  const skip = (page - 1) * pageSize;

  if (kind !== 'content-edits' && kind !== 'marketing') {
    return NextResponse.json({ message: 'Invalid kind' }, { status: 400 });
  }

  try {
    await connectDb();

    if (kind === 'content-edits') {
      const [total, rows] = await Promise.all([
        prisma.contentEditLog.count(),
        prisma.contentEditLog.findMany({
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
        }),
      ]);
      const items = (rows as ContentEditLog[]).map((c) => ({
        id: c.id,
        createdAt: c.createdAt.toISOString(),
        userEmail: c.userEmail,
        userRole: c.userRole,
        kind: c.kind,
        targetPath: c.targetPath,
        summary: c.summary,
      }));
      const res = NextResponse.json({
        kind: 'content-edits' as const,
        items,
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      });
      res.headers.set('Cache-Control', 'private, no-store');
      return res;
    }

    const [total, rows] = await Promise.all([
      prisma.marketingActivityLog.count(),
      prisma.marketingActivityLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);
    const items = (rows as MarketingActivityLog[]).map((m) => ({
      id: m.id,
      createdAt: m.createdAt.toISOString(),
      userEmail: m.userEmail,
      userRole: m.userRole,
      entity: m.entity,
      action: m.action,
      entityId: m.entityId,
      seoNote: m.seoNote,
    }));
    const res = NextResponse.json({
      kind: 'marketing' as const,
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
    res.headers.set('Cache-Control', 'private, no-store');
    return res;
  } catch (error) {
    await captureErrorToDb({
      error,
      request: undefined,
      statusCode: 500,
      context: 'dashboard/admin-activity-logs/GET',
      user: session?.user
        ? { id: session.user.id, email: session.user.email ?? null, role: session.user.role }
        : null,
    });
    console.error('Admin activity logs error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
