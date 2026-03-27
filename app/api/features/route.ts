import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { captureErrorToDb } from '@/lib/error-monitor';
import { FEATURE_FLAG_DEFINITIONS } from '@/lib/features';
import { isSuperAdmin } from '@/lib/role-utils';

export async function GET() {
  try {
    const session = await auth();
    const role = (session as { user?: { role?: string } } | null | undefined)?.user?.role;
    if (!session?.user?.id || !isSuperAdmin(role as any)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const rows = await prisma.featureToggle.findMany({
      orderBy: { name: 'asc' },
      select: { name: true, enabled: true, description: true },
    });
    const byName = new Map(rows.map((r) => [r.name, r]));

    const defined = FEATURE_FLAG_DEFINITIONS.map((def) => {
      const row = byName.get(def.name);
      return {
        name: def.name,
        label: def.label,
        description: def.description,
        enabled: !!row?.enabled,
      };
    });

    const definedNames = new Set(FEATURE_FLAG_DEFINITIONS.map((d) => d.name));
    const extra = rows
      .filter((r) => !definedNames.has(r.name))
      .map((r) => ({
        name: r.name,
        label: r.name,
        description: r.description ?? '',
        enabled: !!r.enabled,
      }));

    const items = [...defined, ...extra.sort((a, b) => a.name.localeCompare(b.name))];

    return NextResponse.json({ items });
  } catch (error) {
    await captureErrorToDb({
      error,
      request: undefined,
      statusCode: 500,
      context: 'features/GET',
      user: null,
    });
    console.error('GET /api/features error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

