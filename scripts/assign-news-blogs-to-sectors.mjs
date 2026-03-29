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
 * Run after sectors exist (`npm run db:seed` or equivalent):
 *   node scripts/assign-news-blogs-to-sectors.mjs
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

const prisma = new PrismaClient();

/** Blog slug → Sector.slug (must match prisma Sector.slug / company-divisions). */
const BLOG_SLUG_TO_SECTOR_SLUG = {
  'future-of-ecommerce-2026': 'ecommerce-marketplace',
  'healthcare-technology-innovations': 'healthcare-medical',
  'sustainable-construction-practices': 'construction-realestate',
  'digital-marketing-strategies': 'digital-marketing',
  'ai-transformation-business': 'software-it-ai',
  'global-trade-opportunities': 'import-export',
  'logistics-automation': 'logistics-warehousing',
  'workforce-development-skills': 'education-skill',
  'media-digital-transformation': 'media-news-entertainment',
  'manufacturing-industry-4-0': 'manufacturing-trading',
  'food-processing-innovation': 'food-beverages',
  'real-estate-investment-tips': 'construction-realestate',
  'cloud-computing-benefits': 'software-it-ai',
  'telemedicine-healthcare': 'healthcare-medical',
  'sustainable-business-practices': 'staffing-consultancy',
  'customer-experience-digital-age': 'digital-marketing',
  'data-security-best-practices': 'software-it-ai',
  'remote-work-productivity': 'staffing-consultancy',
  'supply-chain-resilience': 'logistics-warehousing',
  'entrepreneurship-startup-success': 'staffing-consultancy',
};

async function main() {
  const sectorSlugs = [...new Set(Object.values(BLOG_SLUG_TO_SECTOR_SLUG))];
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

  for (const [blogSlug, sectorSlug] of Object.entries(BLOG_SLUG_TO_SECTOR_SLUG)) {
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
