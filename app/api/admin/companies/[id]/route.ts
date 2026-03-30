import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import { captureErrorToDb } from '@/lib/error-monitor';
import { hasAdminAccess } from '@/lib/role-utils';
import * as z from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAdminRole(role: unknown) {
  return hasAdminAccess(role as any);
}

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  slug: z.string().min(1).max(120).optional(),
  sectorSlug: z.string().min(1).max(120).optional(),
  logoImage: z.string().max(500).optional().nullable(),
  description: z.string().max(4000).optional().nullable(),
  facebookUrl: z.string().max(500).optional().nullable(),
  instagramUrl: z.string().max(500).optional().nullable(),
  xUrl: z.string().max(500).optional().nullable(),
  youtubeUrl: z.string().max(500).optional().nullable(),
  pinterestUrl: z.string().max(500).optional().nullable(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session as { user?: { role?: string } } | null | undefined)?.user?.role;
  if (!session?.user?.id || !isAdminRole(role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  if (!id?.trim()) return NextResponse.json({ message: 'Invalid id' }, { status: 400 });

  try {
    const raw = (await request.json().catch(() => null)) as unknown;
    const parsed = patchSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid input', errors: parsed.error.issues }, { status: 400 });
    }

    const data: any = {};
    if (parsed.data.name != null) data.name = parsed.data.name.trim();
    if (parsed.data.slug != null) data.slug = parsed.data.slug.trim().toLowerCase().replace(/\s+/g, '-');
    if ('logoImage' in parsed.data) data.logoImage = parsed.data.logoImage?.trim() || null;
    if ('description' in parsed.data) data.description = parsed.data.description?.trim() || null;
    if ('facebookUrl' in parsed.data) data.facebookUrl = parsed.data.facebookUrl?.trim() || null;
    if ('instagramUrl' in parsed.data) data.instagramUrl = parsed.data.instagramUrl?.trim() || null;
    if ('xUrl' in parsed.data) data.xUrl = parsed.data.xUrl?.trim() || null;
    if ('youtubeUrl' in parsed.data) data.youtubeUrl = parsed.data.youtubeUrl?.trim() || null;
    if ('pinterestUrl' in parsed.data) data.pinterestUrl = parsed.data.pinterestUrl?.trim() || null;

    await connectDb();
    if (parsed.data.sectorSlug != null) {
      const sector = await prisma.sector.findUnique({
        where: { slug: parsed.data.sectorSlug.trim().toLowerCase() },
        select: { id: true },
      });
      if (!sector) return NextResponse.json({ message: 'Invalid sector' }, { status: 400 });
      data.sectorId = sector.id;
    }

    const updated = await prisma.company.update({
      where: { id },
      data,
      select: { id: true, name: true, slug: true, updatedAt: true },
    });
    return NextResponse.json({ ok: true, company: updated });
  } catch (error) {
    await captureErrorToDb({
      error,
      request,
      statusCode: 500,
      context: 'admin/companies/[id]/PATCH',
      user: session?.user?.id ? { id: session.user.id, email: session.user.email ?? null, role: role ?? null } : null,
    });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session as { user?: { role?: string } } | null | undefined)?.user?.role;
  if (!session?.user?.id || !isAdminRole(role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  if (!id?.trim()) return NextResponse.json({ message: 'Invalid id' }, { status: 400 });

  try {
    await connectDb();
    await prisma.company.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    await captureErrorToDb({
      error,
      request,
      statusCode: 500,
      context: 'admin/companies/[id]/DELETE',
      user: session?.user?.id ? { id: session.user.id, email: session.user.email ?? null, role: role ?? null } : null,
    });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

