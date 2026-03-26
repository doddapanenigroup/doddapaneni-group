import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import { logContentEdit, logMarketingActivity } from '@/lib/audit-log';

function allowMarketer(session: { user?: { role?: string } } | null) {
  const role = session?.user?.role;
  return role === 'DIGITAL_MARKETER' || role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export const runtime = 'nodejs';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !allowMarketer(session)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { key } = await params;
    const decodedKey = decodeURIComponent(key);
    if (!decodedKey.trim()) {
      return NextResponse.json({ message: 'Invalid key' }, { status: 400 });
    }

    await connectDb();
    const existing = await prisma.storedImage.findUnique({ where: { key: decodedKey } });
    if (!existing) return NextResponse.json({ message: 'Image not found' }, { status: 404 });

    await prisma.storedImage.delete({ where: { key: decodedKey } });

    await logMarketingActivity({
      userId: session.user.id,
      userEmail: session.user.email ?? '',
      userRole: session.user.role ?? '',
      entity: 'stored_image',
      entityId: existing.id,
      action: 'delete',
      seoNote: null,
      payload: { key: existing.key, fileName: existing.fileName },
    });

    await logContentEdit({
      userId: session.user.id,
      userEmail: session.user.email ?? '',
      userRole: session.user.role ?? '',
      kind: 'stored_image',
      targetPath: existing.key,
      summary: `delete ${existing.fileName ?? existing.key}`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Marketer stored-image DELETE error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

