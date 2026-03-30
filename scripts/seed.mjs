/**
 * Seed one user per role if not present (4 distinct emails).
 * Run: node scripts/seed.mjs   OR   npm run db:seed
 * Requires DATABASE_URL (PostgreSQL) in .env.local.
 */

import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
config({ path: path.join(projectRoot, '.env.local') });
config({ path: path.join(projectRoot, '.env') });

import { PrismaClient } from '../lib/prisma-generated/index.js';
import bcrypt from 'bcryptjs';
import { SECTOR_SEEDS } from './sector-seeds.mjs';
import { upsertFlagshipCompanies } from './seed-flagship-companies.mjs';

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = String(process.env.SEED_PASSWORD ?? '123').trim();
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL ?? 'lk8772000@gmail.com';
const SUPER_ADMIN_USERNAME = (process.env.SUPER_ADMIN_USERNAME ?? 'lokesh').trim().toLowerCase();
const SUPER_ADMIN_PASSWORD = String(
  process.env.SUPER_ADMIN_PASSWORD ?? 'Lokesh@0317'
).trim();

const SEED_USERS = [
  {
    email: SUPER_ADMIN_EMAIL,
    username: SUPER_ADMIN_USERNAME,
    name: 'Lokesh',
    role: 'SUPER_ADMIN',
    password: SUPER_ADMIN_PASSWORD,
  },
  {
    email: process.env.ADMIN_EMAIL ?? 'admin@doddapaneni-group.com',
    username: 'admin',
    name: 'Admin',
    role: 'ADMIN',
    password: DEFAULT_PASSWORD,
  },
  {
    email: process.env.DEVELOPER_EMAIL ?? 'developer@doddapaneni-group.com',
    username: 'developer',
    name: 'Developer',
    role: 'DEVELOPER',
    password: DEFAULT_PASSWORD,
  },
  {
    email: process.env.MARKETER_EMAIL ?? 'marketer@doddapaneni-group.com',
    username: 'marketer',
    name: 'Digital Marketer',
    role: 'DIGITAL_MARKETER',
    password: DEFAULT_PASSWORD,
  },
];

async function main() {
  for (const u of SEED_USERS) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          email: u.email,
          username: u.username,
          passwordHash: await bcrypt.hash(u.password, 10),
          name: u.name,
          role: u.role,
        },
      });
      console.log('Created', u.role, 'user:', u.email, '(@' + u.username + ')');
    } else {
      console.log(u.role, 'user already exists:', u.email);
    }
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

  await upsertFlagshipCompanies(prisma);

  console.log(
   (
      'Seed done. Sign in with email or username and password at /en/login, then enter the email OTP.\n' +
      'Optional: `npm run media:seed` and/or `npm run db:seed:blogs` (division posts).'
    ).trim(),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
