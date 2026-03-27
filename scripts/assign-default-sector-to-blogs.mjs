/**
 * One-time maintenance script:
 * Assign a default sector to blogs that currently have no sectorId.
 *
 * Behavior:
 * - Never overwrites existing blog.sectorId values
 * - Prefers sector slug "it"
 * - Falls back to sector slug "general" (creates it if missing)
 *
 * Run:
 *   node scripts/assign-default-sector-to-blogs.mjs
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

async function getOrCreateDefaultSector() {
  const it = await prisma.sector.findUnique({
    where: { slug: 'it' },
    select: { id: true, name: true, slug: true },
  });
  if (it) return it;

  const general = await prisma.sector.upsert({
    where: { slug: 'general' },
    create: {
      name: 'General',
      slug: 'general',
      description: 'Default sector for uncategorized blog posts',
    },
    update: {
      name: 'General',
    },
    select: { id: true, name: true, slug: true },
  });
  return general;
}

async function main() {
  const sector = await getOrCreateDefaultSector();

  const before = await prisma.blog.count({ where: { sectorId: null } });
  if (before === 0) {
    console.log('No blogs missing sectorId. Nothing to update.');
    return;
  }

  const result = await prisma.blog.updateMany({
    where: { sectorId: null },
    data: { sectorId: sector.id },
  });

  const after = await prisma.blog.count({ where: { sectorId: null } });

  console.log('Default sector assignment complete.');
  console.log('Default sector:', `${sector.name} (${sector.slug})`);
  console.log('Updated blogs:', result.count);
  console.log('Remaining blogs without sectorId:', after);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

