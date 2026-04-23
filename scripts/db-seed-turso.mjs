/**
 * Run scripts/seed.mjs against Turso.
 *
 * The seed script uses DATABASE_URL first — set it to your Turso URL for this process.
 *
 * Usage: npm run db:seed:turso
 */
import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
config({ path: path.join(root, '.env.local') });
config({ path: path.join(root, '.env') });

const tursoUrl = (process.env.TURSO_DATABASE_URL || '').trim();
const token = (process.env.TURSO_AUTH_TOKEN || '').trim();

if (!tursoUrl || !token) {
  console.error('Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN (same as db:push:turso).');
  process.exit(1);
}

const r = spawnSync('node', [path.join(root, 'scripts', 'seed.mjs')], {
  cwd: root,
  stdio: 'inherit',
  env: {
    ...process.env,
    DATABASE_URL: tursoUrl,
    TURSO_AUTH_TOKEN: token,
  },
});

process.exit(r.status === null ? 1 : r.status);
