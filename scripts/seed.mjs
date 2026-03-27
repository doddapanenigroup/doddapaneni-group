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

const SEED_SECTORS = [
  'IT',
  'Digital Marketing',
  'E-Commerce',
  'Media',
  'Employee Consultancy',
  'Healthcare',
  'Construction',
  'Education',
  'Food Processing',
  'Manufacturing',
  'Logistics',
  'Import Export',
];

function slugify(name) {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

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

  for (const name of SEED_SECTORS) {
    const slug = slugify(name);
    await prisma.sector.upsert({
      where: { slug },
      create: { name, slug, description: null },
      update: { name },
    });
    console.log('Upserted sector:', name, `(${slug})`);
  }

  console.log(
    'Seed done. Sign in with email or username and password at /en/login, then enter the email OTP.'
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
