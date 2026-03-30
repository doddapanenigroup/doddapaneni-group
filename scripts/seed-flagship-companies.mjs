/**
 * Upsert the three flagship group companies so they appear in the admin dashboard
 * and on public sector pages that read from the DB.
 *
 * Run: npm run db:seed:flagship-companies
 * Also runs automatically as part of `npm run db:seed`.
 */

import { readFileSync } from 'node:fs';
import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
config({ path: path.join(projectRoot, '.env.local') });
config({ path: path.join(projectRoot, '.env') });

import { PrismaClient } from '../lib/prisma-generated/index.js';

const FLAGSHIP_COMPANIES = JSON.parse(
  readFileSync(path.join(projectRoot, 'lib/data/flagship-companies.json'), 'utf8'),
);

/** @param {InstanceType<typeof PrismaClient>} prisma */
export async function upsertFlagshipCompanies(prisma) {
  for (const c of FLAGSHIP_COMPANIES) {
    const sector = await prisma.sector.findUnique({
      where: { slug: c.sectorSlug },
      select: { id: true },
    });
    if (!sector) {
      console.warn(
        `[seed-flagship-companies] Skipping ${c.slug}: sector "${c.sectorSlug}" not found. Run db:seed first.`,
      );
      continue;
    }

    await prisma.company.upsert({
      where: { slug: c.slug },
      create: {
        name: c.name,
        slug: c.slug,
        sectorId: sector.id,
        logoImage: c.logoImage ?? null,
        description: c.description ?? null,
        facebookUrl: c.facebookUrl?.trim() || null,
        instagramUrl: c.instagramUrl?.trim() || null,
        xUrl: c.xUrl?.trim() || null,
        youtubeUrl: c.youtubeUrl?.trim() || null,
        pinterestUrl: c.pinterestUrl?.trim() || null,
      },
      update: {
        name: c.name,
        sectorId: sector.id,
        logoImage: c.logoImage ?? null,
        description: c.description ?? null,
        facebookUrl: c.facebookUrl?.trim() || null,
        instagramUrl: c.instagramUrl?.trim() || null,
        xUrl: c.xUrl?.trim() || null,
        youtubeUrl: c.youtubeUrl?.trim() || null,
        pinterestUrl: c.pinterestUrl?.trim() || null,
      },
    });
    console.log('Upserted company:', c.slug, `(sector: ${c.sectorSlug})`);
  }
}

function isMainModule() {
  try {
    return import.meta.url === pathToFileURL(process.argv[1]).href;
  } catch {
    return false;
  }
}

if (isMainModule()) {
  const prisma = new PrismaClient();
  upsertFlagshipCompanies(prisma)
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
