import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { auth } from '@/lib/auth';
import { connectDb, prisma } from '@/lib/db';
import { captureErrorToDb } from '@/lib/error-monitor';
import { canManageCareers } from '@/lib/careers-permissions';
import type { Role } from '@/lib/constants';
import { routing } from '@/i18n/routing';
import { parseApplyLanguageCodesCsv, toApplyLanguageCodesCsv } from '@/lib/career-apply-languages';

const LOCALES = new Set<string>(routing.locales);

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !(await canManageCareers(session.user.role as Role))) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await connectDb();
    const rows = await prisma.careerJob.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: { translations: { orderBy: { locale: 'asc' } } },
    });

    return NextResponse.json({
      items: rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        sortOrder: r.sortOrder,
        status: r.status,
        applyLanguageCodes: parseApplyLanguageCodesCsv(r.applyLanguageCodesCsv),
        updatedAt: r.updatedAt.toISOString(),
        translations: r.translations.map((t) => ({
          locale: t.locale,
          title: t.title,
          subtitle: t.subtitle,
          description: t.description,
          applyLabel: t.applyLabel,
          applyUrl: t.applyUrl,
        })),
      })),
    });
  } catch (error) {
    await captureErrorToDb({
      error,
      request,
      statusCode: 500,
      context: 'careers/jobs/GET',
      user: null,
    });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

type TranslationIn = {
  locale?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  applyLabel?: string;
  applyUrl?: string;
};

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !(await canManageCareers(session.user.role as Role))) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = (await request.json()) as {
      slug?: string;
      sortOrder?: number;
      status?: 'draft' | 'published';
      translations?: TranslationIn[];
      applyLanguageCodes?: string[];
    };

    const translations = Array.isArray(body.translations) ? body.translations : [];
    const en = translations.find((t) => t.locale === 'en');
    if (!en?.title?.trim() || !en.subtitle?.trim() || !en.description?.trim()) {
      return NextResponse.json(
        { message: 'English (en) requires title, subtitle, and description.' },
        { status: 400 },
      );
    }

    let slug = (body.slug && body.slug.trim()) || slugify(en.title);
    if (!slug) slug = `role-${Date.now()}`;

    const sortOrder = typeof body.sortOrder === 'number' && Number.isFinite(body.sortOrder) ? body.sortOrder : 0;
    const status = body.status === 'draft' ? 'draft' : 'published';

    const normalized: { locale: string; title: string; subtitle: string; description: string; applyLabel: string; applyUrl: string }[] = [];
    for (const t of translations) {
      const loc = typeof t.locale === 'string' ? t.locale.trim().toLowerCase() : '';
      if (!LOCALES.has(loc)) continue;
      const title = typeof t.title === 'string' ? t.title.trim() : '';
      const subtitle = typeof t.subtitle === 'string' ? t.subtitle.trim() : '';
      const description = typeof t.description === 'string' ? t.description.trim() : '';
      const applyUrl = typeof t.applyUrl === 'string' ? t.applyUrl.trim() : '';
      if (!title || !subtitle || !description) continue;
      const applyLabel =
        typeof t.applyLabel === 'string' && t.applyLabel.trim() ? t.applyLabel.trim() : 'Apply';
      normalized.push({ locale: loc, title, subtitle, description, applyLabel, applyUrl });
    }

    if (!normalized.some((n) => n.locale === 'en')) {
      return NextResponse.json({ message: 'At least English (en) translation is required.' }, { status: 400 });
    }

    const applyLanguageCodesCsv = toApplyLanguageCodesCsv(body.applyLanguageCodes);
    if (!applyLanguageCodesCsv) {
      return NextResponse.json(
        { message: 'Select at least one application language (English, Telugu, or Hindi).' },
        { status: 400 },
      );
    }

    await connectDb();

    const existing = await prisma.careerJob.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const job = await prisma.careerJob.create({
      data: {
        slug,
        sortOrder,
        status,
        applyLanguageCodesCsv,
        translations: {
          create: normalized.map((n) => ({
            locale: n.locale,
            title: n.title,
            subtitle: n.subtitle,
            description: n.description,
            applyLabel: n.applyLabel,
            applyUrl: n.applyUrl,
          })),
        },
      },
      include: { translations: true },
    });

    revalidateTag('careers-jobs', 'max');

    return NextResponse.json({
      item: {
        id: job.id,
        slug: job.slug,
        sortOrder: job.sortOrder,
        status: job.status,
        applyLanguageCodes: parseApplyLanguageCodesCsv(job.applyLanguageCodesCsv),
        updatedAt: job.updatedAt.toISOString(),
        translations: job.translations.map((t) => ({
          locale: t.locale,
          title: t.title,
          subtitle: t.subtitle,
          description: t.description,
          applyLabel: t.applyLabel,
          applyUrl: t.applyUrl,
        })),
      },
    });
  } catch (error) {
    await captureErrorToDb({
      error,
      request,
      statusCode: 500,
      context: 'careers/jobs/POST',
      user: null,
    });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
