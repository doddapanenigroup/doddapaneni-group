/**
 * Reset Turso/SQLite app tables, then create one Super Admin user.
 * Run: node scripts/reset-and-seed.mjs   OR   npm run db:reset
 *
 * Default Super Admin: lk8772000@gmail.com, username lokesh, password Lokesh@0317
 * Override in .env.local: SUPER_ADMIN_EMAIL, SUPER_ADMIN_USERNAME, SUPER_ADMIN_PASSWORD, SUPER_ADMIN_NAME
 * Requires DATABASE_URL in .env.local.
 */

import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
config({ path: path.join(projectRoot, '.env.local') });
config({ path: path.join(projectRoot, '.env') });

import { createLibsqlPrismaClient } from './create-libsql-prisma.mjs';
import bcrypt from 'bcryptjs';

const prisma = createLibsqlPrismaClient();

const SUPER_ADMIN_EMAIL = (
  process.env.SUPER_ADMIN_EMAIL ?? 'lk8772000@gmail.com'
)
  .trim()
  .toLowerCase();
const SUPER_ADMIN_USERNAME = (process.env.SUPER_ADMIN_USERNAME ?? 'lokesh').trim().toLowerCase();
const SUPER_ADMIN_PASSWORD = String(
  process.env.SUPER_ADMIN_PASSWORD ?? 'Lokesh@0317'
).trim();
const SUPER_ADMIN_NAME = process.env.SUPER_ADMIN_NAME?.trim() ?? 'Lokesh';

if (!SUPER_ADMIN_EMAIL) {
  console.error(
    'Missing SUPER_ADMIN_EMAIL. Set it in .env.local (e.g. SUPER_ADMIN_EMAIL=you@example.com)'
  );
  process.exit(1);
}
if (String(SUPER_ADMIN_PASSWORD).length < 6) {
  console.error('Invalid SUPER_ADMIN_PASSWORD (min 6 characters). Set it in .env.local.');
  process.exit(1);
}

function maskEmail(email) {
  if (!email || !email.includes('@')) return '***';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return '***@' + domain;
  return local.slice(0, 2) + '***@' + domain;
}

function formatInIST(date) {
  return (
    date.toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      hour12: false,
      timeZone: 'Asia/Kolkata',
    }) + ' IST'
  );
}

function formatInET(date) {
  return (
    date.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      hour12: false,
      timeZone: 'America/New_York',
    }) + ' ET'
  );
}

async function main() {
  const url = (process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL || '').trim();
  if (!url) {
    console.error('DATABASE_URL (or TURSO_DATABASE_URL) is required in .env.local');
    process.exit(1);
  }
  console.log('Connecting to database…', url.replace(/:[^:@]+@/, ':****@'));

  await prisma.$transaction(async (tx) => {
    await tx.cronTaskLock.deleteMany();
    await tx.storedImage.deleteMany();
    await tx.adminEmployeeCreateOtp.deleteMany();
    await tx.developerPageView.deleteMany();
    await tx.loginLog.deleteMany();
    await tx.passwordChangeLog.deleteMany();
    await tx.dashboardVisit.deleteMany();
    await tx.webVitalReport.deleteMany();
    await tx.marketingActivityLog.deleteMany();
    await tx.contentEditLog.deleteMany();
    await tx.visit.deleteMany();
    await tx.pageContent.deleteMany();
    await tx.campaign.deleteMany();
    await tx.marketingLink.deleteMany();
    await tx.user.deleteMany();
  });

  console.log('All tables cleared.');

  const createdAt = new Date();
  const passwordHash = await bcrypt.hash(String(SUPER_ADMIN_PASSWORD), 10);

  console.log('Creating Super Admin user:', maskEmail(SUPER_ADMIN_EMAIL));
  await prisma.user.create({
    data: {
      email: SUPER_ADMIN_EMAIL,
      username: SUPER_ADMIN_USERNAME,
      passwordHash,
      name: SUPER_ADMIN_NAME,
      role: 'SUPER_ADMIN',
      createdAtIST: formatInIST(createdAt),
      createdAtET: formatInET(createdAt),
    },
  });

  console.log('Done. Database has been reset with 1 user (Super Admin).');
  console.log(
    'Sign in with email or username:',
    SUPER_ADMIN_EMAIL,
    '/',
    SUPER_ADMIN_USERNAME,
    '+ password from SUPER_ADMIN_PASSWORD (default Lokesh@0317).'
  );
  console.log('Go to /en/login (or your locale) to sign in.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
