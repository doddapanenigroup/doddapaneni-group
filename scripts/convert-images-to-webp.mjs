/**
 * Optimize raster assets in /public: WebP output, optional max width, recompress existing WebP.
 *
 * Usage:
 *   node scripts/convert-images-to-webp.mjs
 *   MAX_WIDTH=1920 WEBP_QUALITY=78 node scripts/convert-images-to-webp.mjs
 *   OPTIMIZE_EXISTING_WEBP=1 MAX_WIDTH=1920 node scripts/convert-images-to-webp.mjs
 *   DELETE_ORIGINALS=1 node scripts/convert-images-to-webp.mjs   # removes .jpg/.png/.avif sources after WebP write
 *   REMOVE_REDUNDANT_RASTERS=1 node scripts/convert-images-to-webp.mjs  # delete .jpg/.png if sibling .webp exists
 *
 * - Skips: .svg, .ico, favicon-dg-*.png (link/OG icons stay lossless PNG where needed)
 * - Raster inputs: .jpg, .jpeg, .png, .avif → writes/rebuilds .webp next to file
 * - With OPTIMIZE_EXISTING_WEBP: re-encodes .webp (resize + quality) to shrink oversize hero assets
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');

const DELETE_ORIGINALS = process.env.DELETE_ORIGINALS === '1';
const REMOVE_REDUNDANT_RASTERS = process.env.REMOVE_REDUNDANT_RASTERS === '1';
const OPTIMIZE_EXISTING_WEBP = process.env.OPTIMIZE_EXISTING_WEBP === '1';
const MAX_WIDTH = Math.min(parseInt(process.env.MAX_WIDTH ?? '1920', 10) || 1920, 8192);
const WEBP_QUALITY = Math.min(
  100,
  Math.max(40, parseInt(process.env.WEBP_QUALITY ?? '78', 10) || 78),
);
const WEBP_EFFORT = Math.min(6, Math.max(0, parseInt(process.env.WEBP_EFFORT ?? '6', 10) || 6));

const SOURCE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.avif']);

function shouldSkipPath(filePath) {
  const base = path.basename(filePath);
  if (base.endsWith('.svg') || base.endsWith('.ico')) return true;
  if (/^favicon-dg-/i.test(base) && base.endsWith('.png')) return true;
  return false;
}

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}

function webpPathForSource(srcPath) {
  const dir = path.dirname(srcPath);
  const base = path.basename(srcPath, path.extname(srcPath));
  return path.join(dir, `${base}.webp`);
}

/**
 * @param {string} filePath
 * @param {string} outPath
 * @param {{ allowDeleteSource?: boolean }} opts
 */
async function rasterToWebp(filePath, outPath, opts = {}) {
  const meta = await sharp(filePath, { failOn: 'none' }).metadata();
  let chain = sharp(filePath, { failOn: 'none' }).rotate();
  if (meta.width && meta.width > MAX_WIDTH) {
    chain = chain.resize(MAX_WIDTH, null, {
      withoutEnlargement: true,
      fit: 'inside',
    });
  }
  await chain
    .webp({
      quality: WEBP_QUALITY,
      effort: WEBP_EFFORT,
      smartSubsample: true,
    })
    .toFile(outPath);

  if (opts.allowDeleteSource && DELETE_ORIGINALS && filePath !== outPath) {
    await fs.unlink(filePath);
  }
}

async function recompressWebpInPlace(filePath) {
  const tmp = `${filePath}.tmp.webp`;
  try {
    await rasterToWebp(filePath, tmp, {});
    await fs.rename(tmp, filePath);
  } catch (e) {
    await fs.unlink(tmp).catch(() => {});
    throw e;
  }
}

async function main() {
  const stats = { converted: 0, webpOptimized: 0, skipped: 0, failed: 0, removedRedundant: 0 };

  for await (const filePath of walk(PUBLIC_DIR)) {
    if (shouldSkipPath(filePath)) {
      stats.skipped++;
      continue;
    }

    const ext = path.extname(filePath).toLowerCase();

    try {
      if (ext === '.webp') {
        if (!OPTIMIZE_EXISTING_WEBP) {
          stats.skipped++;
          continue;
        }
        const meta = await sharp(filePath).metadata();
        const tooWide = meta.width && meta.width > MAX_WIDTH;
        const stat = await fs.stat(filePath);
        const big = stat.size > 350_000;
        if (!tooWide && !big) {
          stats.skipped++;
          continue;
        }
        await recompressWebpInPlace(filePath);
        stats.webpOptimized++;
        continue;
      }

      if (!SOURCE_EXTS.has(ext)) {
        stats.skipped++;
        continue;
      }

      const outPath = webpPathForSource(filePath);
      try {
        const [inStat, outStat] = await Promise.all([
          fs.stat(filePath),
          fs.stat(outPath).catch(() => null),
        ]);
        if (!OPTIMIZE_EXISTING_WEBP && outStat && outStat.mtimeMs >= inStat.mtimeMs) {
          stats.skipped++;
          continue;
        }

        await rasterToWebp(filePath, outPath, { allowDeleteSource: true });
        stats.converted++;
      } catch (err) {
        stats.failed++;
        console.error(`Failed: ${path.relative(ROOT, filePath)}`, err);
      }
    } catch (err) {
      stats.failed++;
      console.error(`Failed: ${path.relative(ROOT, filePath)}`, err);
    }
  }

  if (REMOVE_REDUNDANT_RASTERS) {
    for await (const filePath of walk(PUBLIC_DIR)) {
      if (shouldSkipPath(filePath)) continue;
      const ext = path.extname(filePath).toLowerCase();
      if (!SOURCE_EXTS.has(ext)) continue;
      const siblingWebp = webpPathForSource(filePath);
      try {
        await fs.stat(siblingWebp);
        await fs.unlink(filePath);
        stats.removedRedundant++;
      } catch {
        /* no webp twin */
      }
    }
  }

  console.log(JSON.stringify({ ...stats, MAX_WIDTH, WEBP_QUALITY, WEBP_EFFORT }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
