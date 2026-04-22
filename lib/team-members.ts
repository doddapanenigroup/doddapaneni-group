import { connectDb, prisma } from '@/lib/db';
import type { TeamMember, TeamMemberSection as PrismaTeamMemberSection } from '@/lib/prisma-generated';
import type { TeamMemberPublic, TeamMembersGrouped } from '@/lib/team-members-shared';

export {
  TEAM_MEMBER_DESCRIPTION_MAX_WORDS,
  countWords,
  validateTeamDescription,
  type TeamMemberPublic,
  type TeamMembersGrouped,
  type TeamMemberSection,
} from '@/lib/team-members-shared';

const SECTION_ORDER: Record<PrismaTeamMemberSection, number> = {
  FOUNDER: 0,
  DEVELOPER: 1,
  MARKETER: 2,
};

function sortMembers(rows: TeamMember[]): TeamMember[] {
  return [...rows].sort(
    (a, b) =>
      SECTION_ORDER[a.section] - SECTION_ORDER[b.section] || a.sortOrder - b.sortOrder,
  );
}

export async function getTeamMembersGrouped(): Promise<TeamMembersGrouped> {
  await connectDb();
  const rows = sortMembers(await prisma.teamMember.findMany());
  const founderRow = rows.find((r) => r.section === 'FOUNDER') ?? null;
  const developerRows = rows.filter((r) => r.section === 'DEVELOPER');
  const marketerRows = rows.filter((r) => r.section === 'MARKETER');
  return {
    founder: founderRow ? toTeamMemberPublic(founderRow) : null,
    developers: developerRows.map(toTeamMemberPublic),
    marketers: marketerRows.map(toTeamMemberPublic),
  };
}

export function toTeamMemberPublic(row: TeamMember): TeamMemberPublic {
  return {
    id: row.id,
    section: row.section,
    sortOrder: row.sortOrder,
    name: row.name,
    designation: row.designation,
    description: row.description,
    descriptionExtra: row.descriptionExtra,
    imageUrl: row.imageUrl,
    imageAlt: row.imageAlt,
    imageOffsetX: row.imageOffsetX,
    imageOffsetY: row.imageOffsetY,
    imageScale: row.imageScale,
  };
}
