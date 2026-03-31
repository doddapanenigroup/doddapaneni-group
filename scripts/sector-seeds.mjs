/**
 * Canonical sectors aligned with app routes (Sector.slug).
 * Single source: ../lib/data/canonical-sectors.json
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const SECTOR_SEEDS = JSON.parse(
  readFileSync(path.join(__dirname, '..', 'lib/data/canonical-sectors.json'), 'utf8'),
);
