import { NextResponse } from 'next/server';
import { getTeamMembersGrouped } from '@/lib/team-members';
import { connectDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** Public roster for `/team` (no auth). */
export async function GET() {
  try {
    await connectDb();
    const team = await getTeamMembersGrouped();
    return NextResponse.json(team);
  } catch (error) {
    console.error('GET /api/team-members', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
