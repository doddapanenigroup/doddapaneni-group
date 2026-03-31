/**
 * Align database sectors with the 12 app divisions (lib/data/canonical-sectors.json).
 * Removes any other sector rows; upserts names/descriptions; keeps existing is_live values.
 *
 * Run: npm run db:sync-sectors
 * Warning: deleting a non-canonical sector cascades-deletes its companies.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { PrismaClient } from '../lib/prisma-generated/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
config({ path: path.join(projectRoot, '.env.local') });
config({ path: path.join(projectRoot, '.env') });

const prisma = new PrismaClient();
const seeds = JSON.parse(
  readFileSync(path.join(projectRoot, 'lib/data/canonical-sectors.json'), 'utf8'),
);
const allowed = seeds.map((s) => s.slug);

async function main() {
  const del = await prisma.sector.deleteMany({
    where: { slug: { notIn: allowed } },
  });
  if (del.count > 0) {
    console.warn(
      `Removed ${del.count} non-canonical sector(s). Linked companies on those sectors were cascade-deleted.`,
    );
  }
  for (const row of seeds) {
    await prisma.sector.upsert({
      where: { slug: row.slug },
      create: {
        name: row.name,
        slug: row.slug,
        description: row.description?.trim() || null,
        isLive: Boolean(row.isLive),
      },
      update: {
        name: row.name,
        description: row.description?.trim() || null,
      },
    });
  }
  console.log(`Synced ${seeds.length} canonical sectors (isLive unchanged on existing rows).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
