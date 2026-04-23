/**
 * Deletes every Blog row whose Sector.slug is one of the 12 company divisions
 * (same slugs as lib/company-divisions COMPANY_DIVISION_SLUGS).
 *
 * Does not delete Sector rows, users, or blogs in other sectors.
 *
 * Run:
 *   node scripts/delete-news-blogs-in-divisions.mjs --yes
 *   npm run db:news:delete-in-divisions -- --yes
 */

import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
config({ path: path.join(projectRoot, '.env.local') });
config({ path: path.join(projectRoot, '.env') });

import { createLibsqlPrismaClient } from './create-libsql-prisma.mjs';

const prisma = createLibsqlPrismaClient();

const DIVISION_SLUGS = [
  'software-it-ai',
  'digital-marketing',
  'healthcare-medical',
  'construction-realestate',
  'ecommerce-marketplace',
  'media-news-entertainment',
  'staffing-consultancy',
  'food-beverages',
  'manufacturing-trading',
  'logistics-warehousing',
  'education-skill',
  'import-export',
];

async function main() {
  if (!process.argv.includes('--yes')) {
    console.error(
      'This permanently deletes all blog posts tied to the 12 division sectors.\n' +
        'Run again with: node scripts/delete-news-blogs-in-divisions.mjs --yes',
    );
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const before = await prisma.news.count({
    where: { sector: { slug: { in: DIVISION_SLUGS } } },
  });

  const result = await prisma.news.deleteMany({
    where: { sector: { slug: { in: DIVISION_SLUGS } } },
  });

  console.log('Matched before delete:', before);
  console.log('Deleted rows:', result.count);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
