import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import { captureErrorToDb } from '@/lib/error-monitor';
import { recordApiRequest } from '@/lib/request-monitor';

const DASHBOARD_ROLES = new Set([
  'SUPER_ADMIN',
  'ADMIN',
  'DEVELOPER',
  'DIGITAL_MARKETER',
]);

function clampTake(n: number) {
  return Math.min(Math.max(n, 1), 15);
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await auth();
  recordApiRequest({ request, userId: session?.user?.id ?? null });
  const role = (session as { user?: { role?: string } } | null | undefined)?.user?.role;

  if (!session?.user?.id || !role || !DASHBOARD_ROLES.has(role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const q = (url.searchParams.get('q') ?? '').trim();
  const take = clampTake(Number(url.searchParams.get('limit') ?? '8'));

  if (q.length < 2) {
    return NextResponse.json({
      query: q,
      users: [],
      pages: [],
      blogs: [],
    });
  }

  try {
    await connectDb();

    const pattern = { contains: q, mode: 'insensitive' as const };

    const [users, pages, blogs] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { email: pattern },
            { name: pattern },
            { username: pattern },
          ],
        },
        take,
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          role: true,
        },
        orderBy: { email: 'asc' },
      }),
      prisma.pageContent.findMany({
        where: {
          OR: [{ title: pattern }, { slug: pattern }, { pageKey: pattern }],
        },
        take,
        select: {
          id: true,
          title: true,
          slug: true,
          locale: true,
          status: true,
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.blog.findMany({
        where: {
          OR: [{ title: pattern }, { slug: pattern }],
        },
        take,
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
        },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      query: q,
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        username: u.username,
        role: u.role,
      })),
      pages: pages.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        locale: p.locale,
        status: p.status,
      })),
      blogs: blogs.map((b) => ({
        id: b.id,
        title: b.title,
        slug: b.slug,
        status: b.status,
      })),
    });
  } catch (err) {
    await captureErrorToDb({
      error: err,
      request,
      statusCode: 500,
      user: { id: session.user.id, email: session.user.email ?? null, role },
      context: 'dashboard search',
    });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
