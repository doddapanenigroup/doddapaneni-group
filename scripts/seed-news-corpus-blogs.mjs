/**
 * Upserts the 20 "News corpus" articles from messages/en.json into Blog (published + sector).
 * Without this, those posts only exist as static i18n fallback and assign-news-blogs-to-sectors has nothing to update.
 *
 * Run:
 *   npm run db:seed
 *   npm run media:seed
 *   npm run db:seed:news-corpus
 *   (optional) npm run db:blogs:assign-sectors  — redundant if you use this seed, but safe
 *
 * Requires: users from db:seed; StoredImage rows for featured keys if you want images to resolve (media:seed).
 */

import { config } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
config({ path: path.join(projectRoot, '.env.local') });
config({ path: path.join(projectRoot, '.env') });

import { PrismaClient } from '../lib/prisma-generated/index.js';
import {
  NEWS_CORPUS_IMAGE_KEY_BY_SLUG,
  NEWS_CORPUS_SLUG_TO_SECTOR_SLUG,
} from './news-corpus-sector-map.mjs';

const prisma = new PrismaClient();

function mediaPath(key) {
  return `/api/media/${encodeURIComponent(key)}`;
}

function basePublishedAt() {
  return new Date('2026-02-20T12:00:00.000Z');
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const enPath = path.join(projectRoot, 'messages', 'en.json');
  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const posts = en.Blog?.posts;
  if (!posts || typeof posts !== 'object') {
    console.error('messages/en.json missing Blog.posts');
    process.exit(1);
  }

  const author =
    (await prisma.user.findFirst({
      where: { role: 'DIGITAL_MARKETER' },
      select: { id: true },
    })) ??
    (await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
      select: { id: true },
    }));

  if (!author) {
    console.error('No DIGITAL_MARKETER or SUPER_ADMIN user. Run npm run db:seed first.');
    process.exit(1);
  }

  const sectorSlugs = [...new Set(Object.values(NEWS_CORPUS_SLUG_TO_SECTOR_SLUG))];
  const sectors = await prisma.sector.findMany({
    where: { slug: { in: sectorSlugs } },
    select: { id: true, slug: true },
  });
  const sectorIdBySlug = new Map(sectors.map((s) => [s.slug, s.id]));
  const missingSector = sectorSlugs.filter((s) => !sectorIdBySlug.has(s));
  if (missingSector.length) {
    console.error('Missing sectors:', missingSector.join(', '), '— run npm run db:seed');
    process.exit(1);
  }

  let created = 0;
  let updated = 0;
  let i = 0;

  const entries = Object.entries(NEWS_CORPUS_SLUG_TO_SECTOR_SLUG);
  for (const [slug, sectorSlug] of entries) {
    const p = posts[slug];
    if (!p?.title || !p?.content) {
      console.error('Missing title/content in en.json for', slug);
      process.exit(1);
    }

    const sectorId = sectorIdBySlug.get(sectorSlug);
    const imgKey = NEWS_CORPUS_IMAGE_KEY_BY_SLUG[slug];
    const featured = imgKey ? mediaPath(imgKey) : null;
    const excerpt = String(p.excerpt ?? '').trim();
    const category = String(p.category ?? '').trim();
    const keywords = [category, 'Doddapaneni Group'].filter(Boolean).join(', ');
    const publishedAt = new Date(basePublishedAt().getTime() + i * 60_000);
    i += 1;

    const data = {
      title: p.title,
      content: p.content,
      featuredImage: featured,
      authorId: author.id,
      sectorId,
      status: 'published',
      publishedAt,
      scheduledPublishAt: null,
      metaTitle: p.title,
      metaDescription: excerpt || null,
      keywords,
      ogTitle: p.title,
      ogDescription: excerpt || null,
      ogImage: featured,
    };

    const existing = await prisma.blog.findUnique({ where: { slug } });
    if (existing) {
      await prisma.blog.update({ where: { slug }, data });
      updated++;
      console.log('Updated', slug, '→', sectorSlug);
    } else {
      await prisma.blog.create({ data: { slug, ...data } });
      created++;
      console.log('Created', slug, '→', sectorSlug);
    }
  }

  console.log('');
  console.log('Done. created:', created, 'updated:', updated, 'total:', entries.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
