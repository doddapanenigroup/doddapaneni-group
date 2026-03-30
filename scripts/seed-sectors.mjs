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
import { SECTOR_SEEDS } from './sector-seeds.mjs';

const prisma = new PrismaClient();

async function main() {
  for (const row of SECTOR_SEEDS) {
    await prisma.sector.upsert({
      where: { slug: row.slug },
      create: {
        name: row.name,
        slug: row.slug,
        description: row.description ?? null,
        isLive: row.isLive ?? false,
      },
      update: {
        name: row.name,
        description: row.description ?? null,
        isLive: row.isLive ?? false,
      },
    });
    console.log('Upserted sector:', row.name, `(${row.slug})`);
  }

  console.log(`Seeded ${SECTOR_SEEDS.length} sectors.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
