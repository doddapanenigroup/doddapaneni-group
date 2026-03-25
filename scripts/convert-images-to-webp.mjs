/**
 * Convert raster images in /public to .webp.
 *
 * Usage:
 *   node scripts/convert-images-to-webp.mjs
 *   DELETE_ORIGINALS=1 node scripts/convert-images-to-webp.mjs
 *
 * Notes:
 * - Converts: .jpg, .jpeg, .png, .avif (keeps .svg as-is)
 * - Writes: same basename with .webp next to the source file
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
import process from 'node:process';
 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');

const DELETE_ORIGINALS = process.env.DELETE_ORIGINALS === '1';
const exts = new Set(['.jpg', '.jpeg', '.png', '.avif']);

async function* walk(dir) {
  const entries = await fs.readdir(dir, {withFileTypes: true});
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}

function webpPath(srcPath) {
  const dir = path.dirname(srcPath);
  const base = path.basename(srcPath, path.extname(srcPath));
  return path.join(dir, `${base}.webp`);
}

async function main() {
  const stats = {converted: 0, skipped: 0, failed: 0};

  for await (const filePath of walk(PUBLIC_DIR)) {
    const ext = path.extname(filePath).toLowerCase();
    if (!exts.has(ext)) continue;

    const outPath = webpPath(filePath);
    try {
      // Skip if output exists and is newer/equal
      const [inStat, outStat] = await Promise.all([
        fs.stat(filePath),
        fs.stat(outPath).catch(() => null)
      ]);
      if (outStat && outStat.mtimeMs >= inStat.mtimeMs) {
        stats.skipped++;
        continue;
      }

      const img = sharp(filePath, {failOn: 'none'});
      await img.webp({quality: 82}).toFile(outPath);
      stats.converted++;

      if (DELETE_ORIGINALS) {
        await fs.unlink(filePath);
      }
    } catch (err) {
      stats.failed++;
      // eslint-disable-next-line no-console
      console.error(`Failed: ${path.relative(ROOT, filePath)}`, err);
    }
  }

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(stats, null, 2));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});

