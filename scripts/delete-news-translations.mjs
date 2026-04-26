/**
 * Deletes all rows from `news_translation` (per-locale article copies for /news).
 * Public /news is English-only; run once after deploying the code that stops using these rows.
 *
 *   node scripts/delete-news-translations.mjs --yes
 */

import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
config({ path: path.join(projectRoot, '.env.local'), quiet: true });
config({ path: path.join(projectRoot, '.env'), quiet: true });

import { createLibsqlPrismaClient } from './create-libsql-prisma.mjs';

const prisma = createLibsqlPrismaClient();

async function main() {
  const yes = process.argv.includes('--yes');
  if (!yes) {
    console.error('Refusing to run without --yes. This deletes every NewsTranslation row.');
    process.exit(1);
  }
  const result = await prisma.newsTranslation.deleteMany({});
  console.log(`Deleted ${result.count} news_translation row(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
  });
