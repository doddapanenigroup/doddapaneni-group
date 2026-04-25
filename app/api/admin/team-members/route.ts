import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDb, prisma } from '@/lib/db';
import { captureErrorToDb } from '@/lib/error-monitor';
import { hasAdminAccess } from '@/lib/role-utils';
import type { Role } from '@/lib/constants';
import {
  countWords,
  getTeamMembersGrouped,
  TEAM_MEMBER_DESCRIPTION_MAX_WORDS,
  toTeamMemberPublic,
  validateTeamDescription,
} from '@/lib/team-members';
import type { Session } from 'next-auth';
import { revalidateTeamPublicPaths } from '@/lib/revalidate-team';
import type { TeamMemberSection } from '@/lib/prisma-generated';
import * as z from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const sectionSchema = z.enum(['FOUNDER', 'DEVELOPER', 'MARKETER']);

const bodySchema = z.object({
  section: sectionSchema,
  sortOrder: z.number().int().min(0).max(999).default(0),
  name: z.string().min(1).max(200),
  designation: z.string().min(1).max(200),
  description: z.string().min(1),
  descriptionExtra: z.string().nullable().optional(),
  imageUrl: z.string().min(1).max(2000),
  imageAlt: z.string().max(500).nullable().optional(),
  imageOffsetX: z.number().min(-50).max(50).default(0),
  imageOffsetY: z.number().min(-50).max(50).default(0),
  imageScale: z.number().min(0.5).max(2).default(1),
});

function isAdminSession(session: Session | null) {
  return Boolean(session?.user?.id && hasAdminAccess(session.user.role as Role | null | undefined));
}

export async function GET() {
  try {
    const session = await auth();
    if (!isAdminSession(session)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    await connectDb();
    const team = await getTeamMembersGrouped();
    return NextResponse.json(team);
  } catch (error) {
    console.error('GET /api/admin/team-members', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!isAdminSession(session)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Invalid body', issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const d = parsed.data;
    const descCheck = validateTeamDescription(d.description);
    if (!descCheck.ok) {
      return NextResponse.json({ message: descCheck.message }, { status: 400 });
    }
    if (d.descriptionExtra != null && d.descriptionExtra.trim()) {
      const extraCheck = validateTeamDescription(d.descriptionExtra);
      if (!extraCheck.ok) {
        return NextResponse.json(
          { message: `Second paragraph: ${extraCheck.message}` },
          { status: 400 },
        );
      }
    }

    await connectDb();

    if (d.section === 'FOUNDER') {
      const existing = await prisma.teamMember.count({ where: { section: 'FOUNDER' } });
      if (existing > 0) {
        return NextResponse.json(
          { message: 'A founder already exists. Edit or remove the existing founder first.' },
          { status: 409 },
        );
      }
    }

    const row = await prisma.teamMember.create({
      data: {
        section: d.section as TeamMemberSection,
        sortOrder: d.sortOrder,
        name: d.name.trim(),
        designation: d.designation.trim(),
        description: d.description.trim(),
        descriptionExtra: d.descriptionExtra?.trim() ? d.descriptionExtra.trim() : null,
        imageUrl: d.imageUrl.trim(),
        imageAlt: d.imageAlt?.trim() ? d.imageAlt.trim() : null,
        imageOffsetX: d.imageOffsetX,
        imageOffsetY: d.imageOffsetY,
        imageScale: d.imageScale,
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
      context: 'admin/team-members/POST',
      user: null,
    });
    console.error('POST /api/admin/team-members', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
