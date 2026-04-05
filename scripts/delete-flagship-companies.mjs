/**
 * Removes legacy flagship company rows (dlsin, dealsmedi, janatha-mirror) from the database.
 * Run: npm run db:delete-flagship-companies
 * Requires DATABASE_URL in .env / .env.local.
 */

import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '../lib/prisma-generated/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
config({ path: path.join(projectRoot, '.env.local') });
config({ path: path.join(projectRoot, '.env') });

const SLUGS = ['dlsin', 'dealsmedi', 'janatha-mirror'];

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.company.deleteMany({
    where: { slug: { in: SLUGS } },
  });
  console.log(`Deleted ${result.count} company row(s) with slug in: ${SLUGS.join(', ')}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
