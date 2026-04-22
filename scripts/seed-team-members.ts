/**
 * Idempotent: replaces all `team_member` rows with the default roster (English copy + public image paths).
 * Usage: `npx tsx scripts/seed-team-members.ts`
 */
import 'dotenv/config';
import { PrismaClient } from '../lib/prisma-generated';
import { TEAM_MEMBER_DEFAULT_ROWS } from '../lib/team-default-seed';

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction([
    prisma.teamMember.deleteMany(),
    prisma.teamMember.createMany({ data: TEAM_MEMBER_DEFAULT_ROWS }),
  ]);
  console.log(`Seeded ${TEAM_MEMBER_DEFAULT_ROWS.length} team members.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
