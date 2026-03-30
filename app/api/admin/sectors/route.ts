import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import { captureErrorToDb } from '@/lib/error-monitor';
import { hasAdminAccess } from '@/lib/role-utils';
import { COMPANY_DIVISION_SLUGS, isCompanyDivisionSlug } from '@/lib/company-divisions';
import * as z from 'zod';

const canonicalSectorOrder = new Map(COMPANY_DIVISION_SLUGS.map((s, i) => [s, i]));

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAdminRole(role: unknown) {
  return hasAdminAccess(role as any);
}

const patchSchema = z.object({
  slug: z.string().min(1),
  isLive: z.boolean(),
});

export async function GET(request: Request) {
  const session = await auth();
  const role = (session as { user?: { role?: string } } | null | undefined)?.user?.role;
  if (!session?.user?.id || !isAdminRole(role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDb();
    const sectors = await prisma.sector.findMany({
      where: { slug: { in: [...COMPANY_DIVISION_SLUGS] } },
      select: { id: true, name: true, slug: true, description: true, isLive: true },
    });
    sectors.sort(
      (a, b) =>
        (canonicalSectorOrder.get(a.slug.trim().toLowerCase()) ?? 999) -
        (canonicalSectorOrder.get(b.slug.trim().toLowerCase()) ?? 999),
    );
    return NextResponse.json({ sectors });
  } catch (error) {
    await captureErrorToDb({
      error,
      request,
      statusCode: 500,
      context: 'admin/sectors/GET',
      user: { id: session.user.id, email: session.user.email ?? null, role: role ?? null },
    });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  const role = (session as { user?: { role?: string } } | null | undefined)?.user?.role;
  if (!session?.user?.id || !isAdminRole(role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const raw = (await request.json().catch(() => null)) as unknown;
    const parsed = patchSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid input', errors: parsed.error.issues }, { status: 400 });
    }

    const slug = parsed.data.slug.trim().toLowerCase();
    if (!isCompanyDivisionSlug(slug)) {
      return NextResponse.json({ message: 'Only the 12 group sectors can be toggled.' }, { status: 400 });
    }
    await connectDb();
    const updated = await prisma.sector.update({
      where: { slug },
      data: { isLive: parsed.data.isLive },
      select: { id: true, slug: true, isLive: true },
    });
    return NextResponse.json({ ok: true, sector: updated });
  } catch (error) {
    await captureErrorToDb({
      error,
      request,
      statusCode: 500,
      context: 'admin/sectors/PATCH',
      user: session?.user?.id ? { id: session.user.id, email: session.user.email ?? null, role: role ?? null } : null,
    });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

