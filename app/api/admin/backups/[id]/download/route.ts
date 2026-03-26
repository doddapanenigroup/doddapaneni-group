import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';

function isAdminRole(role: unknown) {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session as { user?: { role?: string } } | null | undefined)?.user?.role;
  if (!session?.user?.id || !isAdminRole(role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  await connectDb();
  const row = await prisma.dbBackup.findUnique({
    where: { id },
    select: { id: true, createdAt: true, dataJson: true },
  });
  if (!row) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  return new NextResponse(row.dataJson, {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="db-backup-${row.id}-${row.createdAt
        .toISOString()
        .slice(0, 10)}.json"`,
    },
  });
}

