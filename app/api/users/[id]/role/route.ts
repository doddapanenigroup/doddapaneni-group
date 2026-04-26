import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDb, prisma } from '@/lib/db';
import type { Role as DbRole } from '@/lib/prisma-generated';
import { writeAuditLog } from '@/lib/audit';
import { captureErrorToDb } from '@/lib/error-monitor';
import { hasAdminAccess } from '@/lib/role-utils';

function isRole(value: unknown): value is DbRole {
  return (
    value === 'ADMIN' || value === 'DEVELOPER' || value === 'DIGITAL_MARKETER' || value === 'HR'
  );
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const actorRole = session?.user?.role as string | undefined;
  if (!session?.user || !hasAdminAccess(actorRole as any)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    if (!id?.trim()) return NextResponse.json({ message: 'Invalid user id' }, { status: 400 });
    if (id === session.user.id) {
      return NextResponse.json({ message: 'Cannot change your own role' }, { status: 400 });
    }

    const body = (await request.json().catch(() => null)) as { role?: unknown } | null;
    const nextRole = body?.role;
    if (!isRole(nextRole)) {
      return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
    }

    await connectDb();
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    const prevRole = user.role as string;
    if (prevRole === 'ADMIN' && nextRole !== 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        return NextResponse.json({ message: 'Cannot demote the last Admin' }, { status: 403 });
      }
    }

    if (prevRole === nextRole) return NextResponse.json({ ok: true });

    await prisma.user.update({ where: { id }, data: { role: nextRole } });

    await writeAuditLog({
      request,
      actor: { id: session.user.id, email: session.user.email ?? null, role: session.user.role ?? null },
      action: 'user.role.change',
      targetType: 'User',
      targetId: id,
      targetLabel: user.email,
      payload: { from: prevRole, to: nextRole },
    });

    return NextResponse.json({ ok: true, from: prevRole, to: nextRole });
  } catch (error) {
    await captureErrorToDb({ error, request, statusCode: 500, user: null, context: 'users/[id]/role/PATCH' });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
