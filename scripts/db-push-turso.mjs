/**
 * Apply schema to Turso: same as `prisma db push`, but expects **DATABASE_URL** to already be your
 * remote libsql URL (see .env.example). Sets PRISMA_PUSH_TARGET so prisma.config.ts uses the adapter.
 *
 * Usage:
 *   Put in .env:  DATABASE_URL=libsql://your-db-....turso.io   TURSO_AUTH_TOKEN=...
 *   Then:        npm run db:push:turso
 *   Or one-off:  DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... npm run db:push:turso
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
  console.error(`db:push:turso requires DATABASE_URL to be your Turso URL (not a file).

Set in .env:
  DATABASE_URL="libsql://your-db-....turso.io"
  TURSO_AUTH_TOKEN="..."   # turso db tokens create <db-name>

Then: npm run db:push:turso
`);
  process.exit(1);
}

if (!token) {
  console.error('Missing TURSO_AUTH_TOKEN (required for libsql://).');
  process.exit(1);
}

console.info(
  '[db-push:turso] Using DATABASE_URL (libsql). Prisma may still print a placeholder schema `url` warning — that is OK.\n',
);

const prismaArgs = ['prisma', 'db', 'push', ...process.argv.slice(2)];
const r = spawnSync('npx', prismaArgs, {
  cwd: root,
  stdio: 'inherit',
  env: {
    ...process.env,
    PRISMA_PUSH_TARGET: 'turso',
  },
});

process.exit(r.status === null ? 1 : r.status);
