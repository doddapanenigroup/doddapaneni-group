import { NextResponse } from 'next/server';
import * as z from 'zod';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import { captureErrorToDb } from '@/lib/error-monitor';
import { isDashboardRole } from '@/lib/role-utils';
import type { Role } from '@/lib/constants';

export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 40;
const MAX_LIMIT = 80;

const createNotificationBody = z.object({
  type: z.string().min(1).max(64),
  title: z.string().min(1).max(500),
  message: z
    .union([z.string().max(2000), z.null(), z.literal('')])
    .optional()
    .transform((v) => (v == null || v === '' ? null : v)),
  body: z
    .union([z.string().max(8000), z.null(), z.literal('')])
    .optional()
    .transform((v) => (v == null || v === '' ? null : v)),
  linkHref: z
    .union([z.string().max(2000), z.null(), z.literal('')])
    .optional()
    .transform((v) => (v == null || v === '' ? null : v.trim()))
    .refine(
      (s) => s == null || s.startsWith('/') || /^https?:\/\//i.test(s),
      { message: 'linkHref must be a path starting with / or a http(s) URL' }
    ),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const role = session.user.role as Role | undefined;
  if (!isDashboardRole(role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = createNotificationBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Invalid input', errors: parsed.error.issues },
      { status: 400 }
    );
  }

  const { type, title, message, body, linkHref } = parsed.data;
  const messageNorm = message ?? title.slice(0, 2000);
  const titleNorm = title.slice(0, 500);

  try {
    await connectDb();
    const created = await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: type.slice(0, 64),
        title: titleNorm,
        message: messageNorm,
        body: body ? body.slice(0, 8000) : null,
        linkHref: linkHref ? linkHref.slice(0, 2000) : null,
        read: false,
      },
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        body: true,
        linkHref: true,
        read: true,
        readAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      item: {
        ...created,
        readAt: created.readAt ? created.readAt.toISOString() : null,
        createdAt: created.createdAt.toISOString(),
      },
    });
  } catch (error) {
    await captureErrorToDb({
      error,
      request,
      statusCode: 500,
      user: session.user,
      context: 'notifications/POST',
    });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

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
          message: true,
          body: true,
          linkHref: true,
          read: true,
          readAt: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({
        where: { userId, read: false },
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
