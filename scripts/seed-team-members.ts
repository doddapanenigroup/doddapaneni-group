/**
 * Idempotent: replaces all `team_member` rows with the default roster (English copy + public image paths).
 * Usage: `npx tsx scripts/seed-team-members.ts`
 */
import 'dotenv/config';
import { createLibsqlPrismaClient } from '../lib/create-libsql-prisma';
import { TEAM_MEMBER_DEFAULT_ROWS } from '../lib/team-default-seed';

const prisma = createLibsqlPrismaClient();

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
