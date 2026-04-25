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

type TranslationIn = {
  locale?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  applyLabel?: string;
  applyUrl?: string;
};

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id || !(await canManageCareers(session.user.role as Role))) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ message: 'Bad request' }, { status: 400 });

    const body = (await request.json()) as {
      slug?: string;
      sortOrder?: number;
      status?: 'draft' | 'published';
      translations?: TranslationIn[];
      applyLanguageCodes?: string[];
    };

    await connectDb();
    const job = await prisma.careerJob.findUnique({ where: { id } });
    if (!job) return NextResponse.json({ message: 'Not found' }, { status: 404 });

    let nextSlug = job.slug;
    if (typeof body.slug === 'string' && body.slug.trim()) {
      const s = slugify(body.slug);
      if (s && s !== job.slug) {
        const clash = await prisma.careerJob.findFirst({ where: { slug: s, NOT: { id } } });
        if (clash) {
          return NextResponse.json({ message: 'Slug already in use' }, { status: 409 });
        }
        nextSlug = s;
      }
    }

    const sortOrder =
      typeof body.sortOrder === 'number' && Number.isFinite(body.sortOrder)
        ? body.sortOrder
        : job.sortOrder;
    const status = body.status === 'draft' || body.status === 'published' ? body.status : job.status;

    let applyLanguageCodesCsv = job.applyLanguageCodesCsv;
    if (body.applyLanguageCodes !== undefined) {
      const next = toApplyLanguageCodesCsv(body.applyLanguageCodes);
      if (!next) {
        return NextResponse.json(
          { message: 'Select at least one application language (English, Telugu, or Hindi).' },
          { status: 400 },
        );
      }
      applyLanguageCodesCsv = next;
    }

    const translations = Array.isArray(body.translations) ? body.translations : null;
    if (translations) {
      const normalized: {
        locale: string;
        title: string;
        subtitle: string;
        description: string;
        applyLabel: string;
        applyUrl: string;
      }[] = [];

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
        return NextResponse.json(
          { message: 'At least English (en) translation is required.' },
          { status: 400 },
        );
      }

      await prisma.$transaction(async (tx) => {
        await tx.careerJobTranslation.deleteMany({ where: { jobId: id } });
        await tx.careerJob.update({
          where: { id },
          data: {
            slug: nextSlug,
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
        });
      });
    } else {
      await prisma.careerJob.update({
        where: { id },
        data: { slug: nextSlug, sortOrder, status, applyLanguageCodesCsv },
      });
    }

    const updated = await prisma.careerJob.findUniqueOrThrow({
      where: { id },
      include: { translations: { orderBy: { locale: 'asc' } } },
    });

    revalidateTag('careers-jobs', 'max');

    return NextResponse.json({
      item: {
        id: updated.id,
        slug: updated.slug,
        sortOrder: updated.sortOrder,
        status: updated.status,
        applyLanguageCodes: parseApplyLanguageCodesCsv(updated.applyLanguageCodesCsv),
        updatedAt: updated.updatedAt.toISOString(),
        translations: updated.translations.map((t) => ({
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
      context: 'careers/jobs/[id]/PATCH',
      user: null,
    });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id || !(await canManageCareers(session.user.role as Role))) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ message: 'Bad request' }, { status: 400 });

    await connectDb();
    try {
      await prisma.careerJob.delete({ where: { id } });
    } catch {
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }
    revalidateTag('careers-jobs', 'max');
    return NextResponse.json({ ok: true });
  } catch (error) {
    await captureErrorToDb({
      error,
      request,
      statusCode: 500,
      context: 'careers/jobs/[id]/DELETE',
      user: null,
    });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
