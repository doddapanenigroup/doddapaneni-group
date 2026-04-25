import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { auth } from '@/lib/auth';
import { connectDb, prisma } from '@/lib/db';
import { captureErrorToDb } from '@/lib/error-monitor';
import { hasAdminAccess } from '@/lib/role-utils';
import type { Role } from '@/lib/constants';
import {
  countWords,
  TEAM_MEMBER_DESCRIPTION_MAX_WORDS,
  toTeamMemberPublic,
  validateTeamDescription,
} from '@/lib/team-members';
import { revalidateTeamPublicPaths } from '@/lib/revalidate-team';
import type { TeamMemberSection } from '@/lib/prisma-generated';
import * as z from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  section: z.enum(['FOUNDER', 'DEVELOPER', 'MARKETER']).optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
  name: z.string().min(1).max(200).optional(),
  designation: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  descriptionExtra: z.string().nullable().optional(),
  imageUrl: z.string().min(1).max(2000).optional(),
  imageAlt: z.string().max(500).nullable().optional(),
  imageOffsetX: z.number().min(-50).max(50).optional(),
  imageOffsetY: z.number().min(-50).max(50).optional(),
  imageScale: z.number().min(0.5).max(2).optional(),
});

function isAdminSession(session: Session | null) {
  return Boolean(session?.user?.id && hasAdminAccess(session.user.role as Role | null | undefined));
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!isAdminSession(session)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    if (!id?.trim()) {
      return NextResponse.json({ message: 'Missing id' }, { status: 400 });
    }

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Invalid body', issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const d = parsed.data;
    if (d.description !== undefined) {
      const descCheck = validateTeamDescription(d.description);
      if (!descCheck.ok) {
        return NextResponse.json({ message: descCheck.message }, { status: 400 });
      }
    }
    if (d.descriptionExtra !== undefined && d.descriptionExtra != null && d.descriptionExtra.trim()) {
      const extraCheck = validateTeamDescription(d.descriptionExtra);
      if (!extraCheck.ok) {
        return NextResponse.json(
          { message: `Second paragraph: ${extraCheck.message}` },
          { status: 400 },
        );
      }
    }

    await connectDb();

    const existing = await prisma.teamMember.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }

    const targetSection = (d.section ?? existing.section) as TeamMemberSection;
    if (targetSection === 'FOUNDER' && existing.section !== 'FOUNDER') {
      const founderCount = await prisma.teamMember.count({ where: { section: 'FOUNDER' } });
      if (founderCount > 0) {
        return NextResponse.json(
          { message: 'A founder already exists. Remove or reassign the other founder first.' },
          { status: 409 },
        );
      }
    }

    const row = await prisma.teamMember.update({
      where: { id },
      data: {
        ...(d.section !== undefined ? { section: d.section as TeamMemberSection } : {}),
        ...(d.sortOrder !== undefined ? { sortOrder: d.sortOrder } : {}),
        ...(d.name !== undefined ? { name: d.name.trim() } : {}),
        ...(d.designation !== undefined ? { designation: d.designation.trim() } : {}),
        ...(d.description !== undefined ? { description: d.description.trim() } : {}),
        ...(d.descriptionExtra !== undefined
          ? {
              descriptionExtra:
                d.descriptionExtra === null || !String(d.descriptionExtra).trim()
                  ? null
                  : String(d.descriptionExtra).trim(),
            }
          : {}),
        ...(d.imageUrl !== undefined ? { imageUrl: d.imageUrl.trim() } : {}),
        ...(d.imageAlt !== undefined
          ? { imageAlt: d.imageAlt === null || !d.imageAlt?.trim() ? null : d.imageAlt.trim() }
          : {}),
        ...(d.imageOffsetX !== undefined ? { imageOffsetX: d.imageOffsetX } : {}),
        ...(d.imageOffsetY !== undefined ? { imageOffsetY: d.imageOffsetY } : {}),
        ...(d.imageScale !== undefined ? { imageScale: d.imageScale } : {}),
      },
    });

    revalidateTeamPublicPaths();

    return NextResponse.json({
      item: toTeamMemberPublic(row),
      wordCount: countWords(row.description),
      maxWords: TEAM_MEMBER_DESCRIPTION_MAX_WORDS,
    });
  } catch (error) {
    await captureErrorToDb({
      error,
      request,
      statusCode: 500,
      context: 'admin/team-members/[id]/PATCH',
      user: null,
    });
    console.error('PATCH /api/admin/team-members/[id]', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!isAdminSession(session)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    if (!id?.trim()) {
      return NextResponse.json({ message: 'Missing id' }, { status: 400 });
    }

    await connectDb();
    try {
      await prisma.teamMember.delete({ where: { id } });
    } catch {
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }

    revalidateTeamPublicPaths();

    return NextResponse.json({ ok: true });
  } catch (error) {
    await captureErrorToDb({
      error,
      request: undefined,
      statusCode: 500,
      context: 'admin/team-members/[id]/DELETE',
      user: null,
    });
    console.error('DELETE /api/admin/team-members/[id]', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
