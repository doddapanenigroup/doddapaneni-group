/**
 * Load every image under public/ into StoredImage (PostgreSQL BYTEA).
 * Run after `npx prisma db push`:  npm run media:seed
 */
import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdir, readFile } from 'node:fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
config({ path: path.join(projectRoot, '.env.local') });
config({ path: path.join(projectRoot, '.env') });

import { PrismaClient } from '../lib/prisma-generated/index.js';

const prisma = new PrismaClient();
const publicDir = path.join(projectRoot, 'public');

const IMAGE_EXT = /\.(webp|png|jpe?g|gif|svg|avif|ico)$/i;

function mimeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.webp') return 'image/webp';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.avif') return 'image/avif';
  if (ext === '.ico') return 'image/x-icon';
  return 'application/octet-stream';
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const out = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...(await walk(full)));
    } else if (IMAGE_EXT.test(e.name)) {
      out.push(full);
    }
  }
  return out;
}

function toKey(absPath) {
  let rel = path.relative(publicDir, absPath);
  rel = rel.split(path.sep).join('/');
  return rel;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const files = await walk(publicDir);
  if (files.length === 0) {
    console.log('No image files found under public/');
    return;
  }

  let n = 0;
  for (const file of files) {
    const key = toKey(file);
    const data = await readFile(file);
    const mimeType = mimeFor(file);
    await prisma.storedImage.upsert({
      where: { key },
      create: { key, mimeType, data },
      update: { mimeType, data },
    });
    n++;
    console.log('Stored', key, `(${mimeType}, ${data.length} bytes)`);
  }
  console.log(`Done. Upserted ${n} image(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
