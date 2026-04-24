/**
 * One-shot Turso setup: `db push` (remote) → seed users/sectors/careers → seed team.
 * Uses TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (same contract as `db-push-turso.mjs`).
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

const tursoUrl = (process.env.TURSO_DATABASE_URL || '').trim();
const token = (process.env.TURSO_AUTH_TOKEN || '').trim();

if (!tursoUrl || !token) {
  console.error('Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env');
  process.exit(1);
}

const extraPushArgs = process.argv.slice(2);
const tursoEnv = {
  ...process.env,
  DATABASE_URL: tursoUrl,
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
  '(If Prisma prints a datasource `url` warning below, ignore it: the schema keeps a placeholder `file:` URL; Turso uses prisma.config.ts + the LibSQL adapter.)\n',
);

runStep('Prisma db push (Turso)', 'npx', ['prisma', 'db', 'push', ...extraPushArgs], {
  ...process.env,
  PRISMA_PUSH_TARGET: 'turso',
  TURSO_DATABASE_URL: tursoUrl,
  TURSO_AUTH_TOKEN: token,
});

runStep('Seed users + sectors + careers', 'node', [path.join(root, 'scripts', 'seed.mjs')], tursoEnv);

runStep('Seed team members', 'npx', ['tsx', path.join(root, 'scripts', 'seed-team-members.ts')], tursoEnv);

console.info('\nDone. Optional: npm run media:seed (with DATABASE_URL pointed at Turso if you store images in DB).');
