/**
 * Apply schema to your *remote* Turso DB.
 *
 * Prisma 6 validates `schema.prisma` SQLite `url` as `file:` only. Remote LibSQL
 * is handled via `prisma.config.ts` (engine js + adapter) when PRISMA_PUSH_TARGET=turso.
 *
 * Requires in .env / .env.local:
 *   DATABASE_URL=file:./dev.db          (keeps schema valid; local dev DB path)
 *   TURSO_DATABASE_URL=libsql://...
 *   TURSO_AUTH_TOKEN=...
 *
 * Usage: npm run db:push:turso
 *        npm run db:push:turso -- --accept-data-loss
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

if (!tursoUrl) {
  console.error(`Missing TURSO_DATABASE_URL.

Keep DATABASE_URL=file:./dev.db in .env (required by Prisma schema validation).
Add:

  TURSO_DATABASE_URL="libsql://your-db-....turso.io"
  TURSO_AUTH_TOKEN="..."   # turso db tokens create <db-name>

Then: npm run db:push:turso
`);
  process.exit(1);
}

if (!tursoUrl.startsWith('libsql:') && !tursoUrl.startsWith('https:')) {
  console.error('TURSO_DATABASE_URL should be a libsql:// or https:// (Turso) URL.');
  process.exit(1);
}

if (!token) {
  console.error('Missing TURSO_AUTH_TOKEN (required for remote libsql://).');
  process.exit(1);
}

const prismaArgs = ['prisma', 'db', 'push', ...process.argv.slice(2)];
const r = spawnSync('npx', prismaArgs, {
  cwd: root,
  stdio: 'inherit',
  env: {
    ...process.env,
    PRISMA_PUSH_TARGET: 'turso',
    TURSO_DATABASE_URL: tursoUrl,
    TURSO_AUTH_TOKEN: token,
  },
});

process.exit(r.status === null ? 1 : r.status);
