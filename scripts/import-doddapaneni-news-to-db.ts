/**
 * Imports articles from `lib/doddapaneni-news.ts` into the `news` table with sector links.
 *
 * Run: npx tsx scripts/import-doddapaneni-news-to-db.ts
 * Requires DATABASE_URL and seeded sectors + a DIGITAL_MARKETER or SUPER_ADMIN user.
 */

import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '../lib/prisma-generated/index.js';
import { DODDAPANENI_NEWS_SECTORS, type NewsArticle } from '../lib/doddapaneni-news';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '..', '.env.local') });
config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function articleToHtml(a: NewsArticle): string {
  const parts: string[] = [`<p>${escapeHtml(a.contentIntro)}</p>`];
  for (const sec of a.sections) {
    parts.push(`<h2>${escapeHtml(sec.heading)}</h2>`);
    for (const p of sec.paragraphs) {
      parts.push(`<p>${escapeHtml(p)}</p>`);
    }
  }
  return parts.join('\n');
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const author =
    (await prisma.user.findFirst({ where: { role: 'DIGITAL_MARKETER' }, select: { id: true } })) ??
    (await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' }, select: { id: true } }));
  if (!author) {
    console.error('No DIGITAL_MARKETER or SUPER_ADMIN user. Run npm run db:seed first.');
    process.exit(1);
  }

  const publishedAt = new Date();
  let count = 0;

  for (const sector of DODDAPANENI_NEWS_SECTORS) {
    const row = await prisma.sector.findUnique({
      where: { slug: sector.slug },
      select: { id: true },
    });
    if (!row) {
      console.warn('Skipping sector (not in database):', sector.slug);
      continue;
    }

    for (const art of sector.news) {
      const html = articleToHtml(art);
      await prisma.news.upsert({
        where: { slug: art.slug },
        create: {
          title: art.title,
          slug: art.slug,
          content: html,
          authorId: author.id,
          sectorId: row.id,
          status: 'published',
          publishedAt,
          metaTitle: art.title,
          metaDescription: art.excerpt,
          keywords: null,
          ogTitle: art.title,
          ogDescription: art.excerpt,
          featuredImage: null,
        },
        update: {
          title: art.title,
          content: html,
          sectorId: row.id,
          status: 'published',
          publishedAt,
          metaTitle: art.title,
          metaDescription: art.excerpt,
          ogTitle: art.title,
          ogDescription: art.excerpt,
        },
      });
      count++;
      console.log('Upserted', sector.slug, '→', art.slug);
    }
  }

  console.log(`Done. ${count} article(s) in news table (linked to sectors).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
