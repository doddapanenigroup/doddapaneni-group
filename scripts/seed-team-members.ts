/**
 * Idempotent: replaces all `team_member` rows with the default roster (English copy + public image paths).
 * Usage: `npx tsx scripts/seed-team-members.ts`
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
config({ path: path.join(projectRoot, '.env.local'), quiet: true });
config({ path: path.join(projectRoot, '.env'), quiet: true });
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
