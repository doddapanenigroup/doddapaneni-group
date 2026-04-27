/**
 * Run scripts/seed.mjs against Turso.
 *
 * Requires **DATABASE_URL=libsql://…** and **TURSO_AUTH_TOKEN** in .env.
 *
 * Usage: npm run db:seed:turso
 */
import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
config({ path: path.join(root, '.env.local'), quiet: true });
config({ path: path.join(root, '.env'), quiet: true });

const url = (process.env.DATABASE_URL || '').trim();
const token = (process.env.TURSO_AUTH_TOKEN || '').trim();

if (!url || (!url.startsWith('libsql:') && !url.startsWith('https:'))) {
  console.error('Set DATABASE_URL=libsql://… and TURSO_AUTH_TOKEN for db:seed:turso');
  process.exit(1);
}

if (!token) {
  console.error('Set TURSO_AUTH_TOKEN');
  process.exit(1);
}

const r = spawnSync('node', [path.join(root, 'scripts', 'seed.mjs')], {
  cwd: root,
  stdio: 'inherit',
  env: {
    ...process.env,
    DATABASE_URL: url,
    TURSO_AUTH_TOKEN: token,
  },
});

process.exit(r.status === null ? 1 : r.status);
