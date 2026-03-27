import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import type { Role } from '@/lib/constants';
import { recordApiRequest } from '@/lib/request-monitor';
import { hasDeveloperAccess } from '@/lib/role-utils';

function allowedRole(role: Role | undefined): boolean {
  return hasDeveloperAccess(role);
}

function parseDate(value: string | null, endOfDay = false): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  if (endOfDay) d.setHours(23, 59, 59, 999);
  return d;
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    const role = session?.user?.role as Role | undefined;
    if (!session?.user || !allowedRole(role)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    recordApiRequest({ request, userId: session.user.id });

    const url = new URL(request.url);
    const from = parseDate(url.searchParams.get('from'));
    const to = parseDate(url.searchParams.get('to'), true);
    const take = Math.min(200, Math.max(10, Number(url.searchParams.get('take') || 50)));
    const createdAtClause = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    };
    const finalWhere = Object.keys(createdAtClause).length ? { createdAt: createdAtClause } : {};

    await connectDb();

    const items = await prisma.errorLog.findMany({
      where: finalWhere,
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        createdAt: true,
        message: true,
        stackTrace: true,
        path: true,
        method: true,
        statusCode: true,
        userEmail: true,
        userRole: true,
      },
    });

    return NextResponse.json({
      filters: { from: from?.toISOString() ?? null, to: to?.toISOString() ?? null, take },
      items: items.map((i) => ({
        id: i.id,
        createdAt: i.createdAt.toISOString(),
        message: i.message,
        stackTrace: i.stackTrace,
        path: i.path,
        method: i.method,
        statusCode: i.statusCode,
        userEmail: i.userEmail,
        userRole: i.userRole,
      })),
    });
  } catch (error) {
    console.error('Developer errors GET error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

