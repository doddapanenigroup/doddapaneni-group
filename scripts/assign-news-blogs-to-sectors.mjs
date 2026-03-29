/**
 * Assigns the 20 locale News corpus articles (see messages Blog.posts and lib/blog-post-meta.ts)
 * to the correct Sector row by division slug.
 *
 * Category → sector (canonical slug):
 * - E-Commerce → ecommerce-marketplace
 * - Healthcare → healthcare-medical
 * - Construction / Real Estate → construction-realestate
 * - Digital Marketing → digital-marketing
 * - Technology → software-it-ai
 * - Import/Export → import-export
 * - Logistics → logistics-warehousing
 * - Education → education-skill
 * - Media → media-news-entertainment
 * - Manufacturing → manufacturing-trading
 * - Food Processing → food-beverages
 * - Business → staffing-consultancy (organizational / consultancy themes)
 *
 * If every slug reports "No Blog row", insert rows first: `npm run db:seed:news-corpus`
 *
 * Run after sectors exist (`npm run db:seed` or equivalent):
 *   npm run db:blogs:assign-sectors
 *
 * Idempotent: overwrites sectorId for these slugs each run (safe to re-run).
 */

import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
config({ path: path.join(projectRoot, '.env.local') });
config({ path: path.join(projectRoot, '.env') });

import { PrismaClient } from '../lib/prisma-generated/index.js';
import { NEWS_CORPUS_SLUG_TO_SECTOR_SLUG } from './news-corpus-sector-map.mjs';

const prisma = new PrismaClient();

async function main() {
  const sectorSlugs = [...new Set(Object.values(NEWS_CORPUS_SLUG_TO_SECTOR_SLUG))];
  const sectors = await prisma.sector.findMany({
    where: { slug: { in: sectorSlugs } },
    select: { id: true, slug: true },
  });
  const bySlug = new Map(sectors.map((s) => [s.slug, s.id]));
  const missing = sectorSlugs.filter((s) => !bySlug.has(s));
  if (missing.length) {
    console.error('Missing Sector rows for slugs:', missing.join(', '));
    console.error('Run sector seed first (e.g. npm run db:seed).');
    process.exit(1);
  }

  let updated = 0;
  let notFound = 0;

  for (const [blogSlug, sectorSlug] of Object.entries(NEWS_CORPUS_SLUG_TO_SECTOR_SLUG)) {
    const sectorId = bySlug.get(sectorSlug);
    const row = await prisma.blog.updateMany({
      where: { slug: blogSlug },
      data: { sectorId },
    });
    if (row.count === 0) {
      notFound++;
      console.warn('No Blog row for slug:', blogSlug);
    } else {
      updated += row.count;
      console.log('OK', blogSlug, '→', sectorSlug);
    }
  }

  console.log('');
  console.log('Done. Rows updated:', updated, '| Slugs not in DB:', notFound);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
