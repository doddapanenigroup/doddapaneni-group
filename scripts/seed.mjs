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

  try {
    const careerCount = await prisma.careerJob.count();
    if (careerCount === 0) {
      const locales = ['en', 'te', 'hi', 'es'];
      const mailto = (title) =>
        `mailto:doddapanenigroup@yahoo.com?subject=${encodeURIComponent(`Application: ${title}`)}`;

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
                applyUrl: mailto(en.title),
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
          'Run: npx prisma migrate deploy',
          'Then run: npm run db:seed   (to add default job listings)',
        ].join('\n'),
      );
    } else {
      throw e;
    }
  }

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
