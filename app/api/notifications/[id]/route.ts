import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import { captureErrorToDb } from '@/lib/error-monitor';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json({ message: 'Invalid id' }, { status: 400 });
  }

  let body: { read?: unknown };
  try {
    body = (await request.json()) as { read?: unknown };
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }

  const read = body.read === true;

  try {
    await connectDb();
    const row = await prisma.notification.findFirst({
      where: { id: id.trim(), userId: session.user.id },
    });
    if (!row) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }

    const updated = await prisma.notification.update({
      where: { id: row.id },
      data: { readAt: read ? new Date() : null },
      select: {
        id: true,
        readAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      readAt: updated.readAt ? updated.readAt.toISOString() : null,
    });
  } catch (error) {
    await captureErrorToDb({
      error,
      request,
      statusCode: 500,
      user: session.user,
      context: 'notifications/[id]/PATCH',
    });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
