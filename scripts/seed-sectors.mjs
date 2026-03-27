/**
 * Seed predefined Sectors (categories) without duplicates.
 *
 * Run:
 *   node scripts/seed-sectors.mjs
 *
 * Uses DATABASE_URL from .env.local / .env (same as other seed scripts).
 */

import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
config({ path: path.join(projectRoot, '.env.local') });
config({ path: path.join(projectRoot, '.env') });

import { PrismaClient } from '../lib/prisma-generated/index.js';

const prisma = new PrismaClient();

const SECTORS = [
  'IT',
  'Digital Marketing',
  'E-Commerce',
  'Media',
  'Employee Consultancy',
  'Healthcare',
  'Construction',
  'Education',
  'Food Processing',
  'Manufacturing',
  'Logistics',
  'Import Export',
];

function slugify(name) {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function main() {
  const rows = SECTORS.map((name) => ({ name, slug: slugify(name) }));

  for (const s of rows) {
    await prisma.sector.upsert({
      where: { slug: s.slug },
      create: {
        name: s.name,
        slug: s.slug,
        description: null,
      },
      update: {
        name: s.name,
      },
    });
    console.log('Upserted sector:', s.name, `(${s.slug})`);
  }

  console.log(`Seeded ${rows.length} sectors.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

