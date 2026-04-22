import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import { hasAdminAccess } from '@/lib/role-utils';
import type { Role } from '@/lib/constants';
import { TEAM_MEMBER_DEFAULT_ROWS } from '@/lib/team-default-seed';
import { revalidateTeamPublicPaths } from '@/lib/revalidate-team';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** One-time style import: only runs if `team_member` is empty. */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id || !hasAdminAccess(session.user.role as Role | null | undefined)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await connectDb();
    const count = await prisma.teamMember.count();
    if (count > 0) {
      return NextResponse.json(
        {
          message:
            'Team members already exist. Delete them from the admin team page first if you want to re-seed.',
        },
        { status: 409 },
      );
    }

    await prisma.teamMember.createMany({ data: TEAM_MEMBER_DEFAULT_ROWS });
    revalidateTeamPublicPaths();

    return NextResponse.json({ ok: true, inserted: TEAM_MEMBER_DEFAULT_ROWS.length });
  } catch (error) {
    console.error('POST /api/admin/team-members/seed', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
