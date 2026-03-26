import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { captureErrorToDb } from '@/lib/error-monitor';
import { writeAuditLog } from '@/lib/audit';
import { invalidateFeatureFlagCache } from '@/lib/features';

function isAllowedToEdit(session: unknown): boolean {
  const role = (session as { user?: { role?: string } } | null | undefined)?.user?.role;
  return role === 'SUPER_ADMIN';
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    if (!name?.trim()) {
      return NextResponse.json({ message: 'Missing feature name' }, { status: 400 });
    }

    const row = await prisma.featureToggle.findUnique({
      where: { name: name.trim() },
      select: { enabled: true },
    });

    return NextResponse.json({ name: name.trim(), enabled: !!row?.enabled });
  } catch (error) {
    await captureErrorToDb({
      error,
      request: undefined,
      statusCode: 500,
      context: 'features/[name]/GET',
      user: null,
    });
    console.error('GET /api/features/[name] error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const session = await auth();
    if (!isAllowedToEdit(session)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { name } = await params;
    if (!name?.trim()) {
      return NextResponse.json({ message: 'Missing feature name' }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
    }

    const enabled = (body as { enabled?: unknown }).enabled;
    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ message: 'enabled must be boolean' }, { status: 400 });
    }

    const row = await prisma.featureToggle.upsert({
      where: { name: name.trim() },
      create: { name: name.trim(), enabled },
      update: { enabled },
      select: { name: true, enabled: true },
    });

    await writeAuditLog({
      request,
      actor: {
        id: (session as any)?.user?.id ?? '',
        email: (session as any)?.user?.email ?? null,
        role: (session as any)?.user?.role ?? null,
      },
      action: 'settings.feature_toggle.update',
      targetType: 'FeatureToggle',
      targetId: row.name,
      targetLabel: row.name,
      payload: { enabled: row.enabled },
    });

    invalidateFeatureFlagCache(row.name);

    return NextResponse.json({ ...row, ok: true });
  } catch (error) {
    await captureErrorToDb({
      error,
      request,
      statusCode: 500,
      context: 'features/[name]/PATCH',
      user: null,
    });
    console.error('PATCH /api/features/[name] error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

