/**
 * Seed dashboard users (Admin + Developer + Digital Marketer; optional second Admin via ADMIN_EMAIL).
 * Run: node scripts/seed.mjs   OR   npm run db:seed
 * Requires DATABASE_URL (Turso libsql://…) and TURSO_AUTH_TOKEN in .env.local (or .env).
 */

import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
config({ path: path.join(projectRoot, '.env.local'), quiet: true });
config({ path: path.join(projectRoot, '.env'), quiet: true });

import { createLibsqlPrismaClient } from './create-libsql-prisma.mjs';
import bcrypt from 'bcryptjs';
import { SECTOR_SEEDS } from './sector-seeds.mjs';

const prisma = createLibsqlPrismaClient();

async function migrateLegacySuperAdminToAdmin() {
  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "User" SET role = 'ADMIN' WHERE role = 'SUPER_ADMIN'`,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn('[seed] legacy SUPER_ADMIN→ADMIN migration:', msg);
  }
}

const DEFAULT_PASSWORD = String(process.env.SEED_PASSWORD ?? '123').trim();
const SUPER_ADMIN_EMAIL = (process.env.SUPER_ADMIN_EMAIL ?? 'lk8772000@gmail.com').trim().toLowerCase();
const SUPER_ADMIN_USERNAME = (process.env.SUPER_ADMIN_USERNAME ?? 'lokesh').trim().toLowerCase();
const SUPER_ADMIN_PASSWORD = String(
  process.env.SUPER_ADMIN_PASSWORD ?? 'Lokesh@0317'
).trim();

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? 'admin@doddapaneni-group.com').trim().toLowerCase();
/** Must differ from `SUPER_ADMIN_USERNAME` when both seed rows exist — default avoids clashing with common `admin` handle. */
const ADMIN_USERNAME = (process.env.ADMIN_USERNAME ?? 'doddapaneni-admin').trim().toLowerCase();

function buildSeedUsers() {
  const rows = [
    {
      email: SUPER_ADMIN_EMAIL,
      username: SUPER_ADMIN_USERNAME,
      name: process.env.SUPER_ADMIN_NAME?.trim() || 'Lokesh',
      role: 'ADMIN',
      password: SUPER_ADMIN_PASSWORD,
    },
  ];
  if (ADMIN_EMAIL && ADMIN_EMAIL !== SUPER_ADMIN_EMAIL) {
    rows.push({
      email: ADMIN_EMAIL,
      username: ADMIN_USERNAME,
      name: 'Admin',
      role: 'ADMIN',
      password: DEFAULT_PASSWORD,
    });
  }
  rows.push(
    {
      email: (process.env.DEVELOPER_EMAIL ?? 'developer@doddapaneni-group.com').trim().toLowerCase(),
      username: 'developer',
      name: 'Developer',
      role: 'DEVELOPER',
      password: DEFAULT_PASSWORD,
    },
    {
      email: (process.env.MARKETER_EMAIL ?? 'marketer@doddapaneni-group.com').trim().toLowerCase(),
      username: 'marketer',
      name: 'Digital Marketer',
      role: 'DIGITAL_MARKETER',
      password: DEFAULT_PASSWORD,
    }
  );

  const seen = new Set();
  const out = [];
  for (const u of rows) {
    if (seen.has(u.email)) continue;
    seen.add(u.email);
    out.push(u);
  }
  const usedUsernames = new Set();
  for (const u of out) {
    if (usedUsernames.has(u.username)) {
      throw new Error(
        `[seed] Duplicate username "${u.username}" in seed config. Set a unique ADMIN_USERNAME (and SUPER_ADMIN_USERNAME).`
      );
    }
    usedUsernames.add(u.username);
  }
  return out;
}

const SEED_USERS = buildSeedUsers();

/**
 * Upsert by email. If another row already uses this seed `username`, rename that row so
 * we never hit P2002 on the global `username` unique constraint.
 */
async function upsertSeedUser(u) {
  const passwordHash = await bcrypt.hash(u.password, 10);
  const byEmail = await prisma.user.findUnique({ where: { email: u.email } });

  async function ensureUsernameAvailable(exceptUserId) {
    const blocker = await prisma.user.findFirst({
      where: exceptUserId
        ? { username: u.username, NOT: { id: exceptUserId } }
        : { username: u.username },
      select: { id: true, username: true },
    });
    if (!blocker) return;
    const suffix = blocker.id.replace(/[^a-z0-9]/gi, '').slice(0, 10) || 'x';
    const next = `${String(blocker.username ?? 'user')}_seed_${suffix}`.slice(0, 48);
    await prisma.user.update({ where: { id: blocker.id }, data: { username: next } });
    console.warn('[seed] renamed conflicting username to', next, 'for user id', blocker.id);
  }

  if (byEmail) {
    await ensureUsernameAvailable(byEmail.id);
    await prisma.user.update({
      where: { id: byEmail.id },
      data: {
        username: u.username,
        passwordHash,
        name: u.name,
        role: u.role,
      },
    });
    return;
  }

  await ensureUsernameAvailable(null);

  await prisma.user.create({
    data: {
      email: u.email,
      username: u.username,
      passwordHash,
      name: u.name,
      role: u.role,
    },
  });
}

async function main() {
  await migrateLegacySuperAdminToAdmin();
  for (const u of SEED_USERS) {
    await upsertSeedUser(u);
    console.log('Upserted', u.role, 'user:', u.email, '(@' + u.username + ')');
  }

  for (const row of SECTOR_SEEDS) {
    await prisma.sector.upsert({
      where: { slug: row.slug },
      create: {
        name: row.name,
        slug: row.slug,
        description: row.description ?? null,
        isLive: row.isLive ?? false,
      },
      update: {
        name: row.name,
        description: row.description ?? null,
        isLive: row.isLive ?? false,
      },
    });
    console.log('Upserted sector:', row.name, `(${row.slug})`);
  }

  try {
    const careerCount = await prisma.careerJob.count();
    if (careerCount === 0) {
      const locales = ['en', 'te', 'hi', 'es'];
      const seeds = [
        {
          slug: 'full-stack-developer-next-node',
          sortOrder: 0,
          en: {
            title: 'Full Stack Developer (Next.js, Node.js)',
            subtitle: 'Work from office (US/EU overlap) · Full-time',
            description:
              'Own premium UI systems in Next.js, partner with design on motion and accessibility, and help set performance budgets.',
          },
        },
        {
          slug: 'graphic-designer',
          sortOrder: 1,
          en: {
            title: 'Graphic Designer',
            subtitle: 'Work from office (US/EU overlap) · Full-time',
            description:
              'Create distinctive brand graphics, logos, and layouts that express identity clearly across digital, print, and social.',
          },
        },
        {
          slug: 'digital-marketing-intern',
          sortOrder: 2,
          en: {
            title: 'Digital Marketing Intern',
            subtitle: 'Work from office (US/EU overlap) · Internship',
            description:
              'Assist with campaigns, SEO, social media, analytics, and online brand growth.',
          },
        },
      ];

      for (const row of seeds) {
        const { en } = row;
        await prisma.careerJob.create({
          data: {
            slug: row.slug,
            sortOrder: row.sortOrder,
            status: 'published',
            translations: {
              create: locales.map((locale) => ({
                locale,
                title: en.title,
                subtitle: en.subtitle,
                description: en.description,
                applyLabel: 'Apply',
                applyUrl: '',
              })),
            },
          },
        });
        console.log('Seeded career job:', row.slug);
      }
    } else {
      console.log('Career jobs already present; skip careers seed');
    }
  } catch (e) {
    if (e && e.code === 'P2021') {
      console.warn(
        [
          'Careers tables are missing (migrations not applied yet).',
          'Run: npx prisma db push',
          'Then run: npm run db:seed   (to add default job listings)',
        ].join('\n'),
      );
    } else {
      throw e;
    }
  }

  console.log(
    [
      'Seed done. Sign in at /en/login with email or username + password (same DATABASE_URL as the app).',
      'Optional: `npm run media:seed` and/or `npm run db:seed:blogs` (division posts).',
    ].join('\n'),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
