/**
 * Browser-safe team roster helpers and types (no Prisma / DB).
 * Client components must import from this module, not `team-members.ts`.
 */

export const TEAM_MEMBER_DESCRIPTION_MAX_WORDS = 200;

export type TeamMemberSection = 'FOUNDER' | 'DEVELOPER' | 'MARKETER';

export type TeamMemberPublic = {
  id: string;
  section: TeamMemberSection;
  sortOrder: number;
  name: string;
  designation: string;
  description: string;
  descriptionExtra: string | null;
  imageUrl: string;
  imageAlt: string | null;
  imageOffsetX: number;
  imageOffsetY: number;
  imageScale: number;
};

export type TeamMembersGrouped = {
  founder: TeamMemberPublic | null;
  developers: TeamMemberPublic[];
  marketers: TeamMemberPublic[];
};

export function countWords(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length;
}

export function validateTeamDescription(description: string): { ok: true } | { ok: false; message: string } {
  const n = countWords(description);
  if (n === 0) return { ok: false, message: 'Description is required.' };
  if (n > TEAM_MEMBER_DESCRIPTION_MAX_WORDS) {
    return {
      ok: false,
      message: `Description must be at most ${TEAM_MEMBER_DESCRIPTION_MAX_WORDS} words (currently ${n}).`,
    };
  }
  return { ok: true };
}
