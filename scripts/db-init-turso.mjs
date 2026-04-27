/**
 * One-shot Turso setup: `db push` → seed users/sectors/careers → seed team.
 *
 * Requires **DATABASE_URL=libsql://…** and **TURSO_AUTH_TOKEN** in .env (same DB the app will use).
 *
 * Usage: npm run db:turso:init
 *        npm run db:turso:init -- --accept-data-loss
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
  console.error('Set DATABASE_URL=libsql://… and TURSO_AUTH_TOKEN in .env for db:turso:init');
  process.exit(1);
}

if (!token) {
  console.error('Set TURSO_AUTH_TOKEN in .env');
  process.exit(1);
}

const tursoEnv = {
  ...process.env,
  DATABASE_URL: url,
  TURSO_AUTH_TOKEN: token,
};

function runStep(title, command, args, env) {
  console.info(`\n→ ${title}`);
  const r = spawnSync(command, args, { cwd: root, stdio: 'inherit', env, shell: false });
  if (r.status !== 0) {
    console.error(`Failed: ${title}`);
    process.exit(r.status ?? 1);
  }
}

console.info(
  '(If Prisma prints a datasource `url` warning below, ignore it: the schema keeps a placeholder `file:` URL; the LibSQL adapter uses DATABASE_URL.)\n',
);

runStep('Prisma db push (Turso)', 'npx', ['prisma', 'db', 'push', ...process.argv.slice(2)], {
  ...tursoEnv,
  PRISMA_PUSH_TARGET: 'turso',
});

runStep('Seed users + sectors + careers', 'node', [path.join(root, 'scripts', 'seed.mjs')], tursoEnv);

runStep('Seed team members', 'npx', ['tsx', path.join(root, 'scripts', 'seed-team-members.ts')], tursoEnv);

console.info('\nDone. Optional: npm run media:seed');
