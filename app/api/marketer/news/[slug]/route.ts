import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import { logMarketingActivity } from '@/lib/audit-log';
import { logContentEdit } from '@/lib/audit-log';
import { captureErrorToDb } from '@/lib/error-monitor';
import { allowMarketerModule } from '@/app/api/marketer/_permissions';
import { writeAuditLog } from '@/lib/audit';
import { notifyContentPublished } from '@/lib/notify';
import { routing } from '@/i18n/routing';
import { applyMachineTranslationsFromCanonicalPost } from '@/lib/blog-translations-sync';
import { applyNewsTranslationPatches } from '@/lib/news-apply-translation-patches';
import { schedulingForbiddenIfScheduled } from '@/lib/features';
import {
  newsPatchDataFromBody,
  parseTranslationPatches,
} from '@/lib/marketer-news-fields';
import { revalidateCmsPublicSurfaces, revalidateNewsPostPublicPaths } from '@/lib/revalidate-cms-public';
import { isNewsSlugUniqueViolation } from '@/lib/prisma-news-unique';
import {
  collectStoredImageKeysFromNews,
  deleteOrphanedStoredImagesForKeys,
} from '@/lib/news-stored-image-cleanup';

function strOrNull(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t.length ? t : null;
}

function dateOrNull(v: unknown): Date | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  if (!t) return null;
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function resolveSectorIdIfProvided(raw: unknown): Promise<
  { ok: true; sectorId: string | null } | { ok: false; status: number; message: string }
> {
  if (raw == null) return { ok: true, sectorId: null };
  const sectorId = strOrNull(raw);
  if (!sectorId) {
    console.warn('[marketer/blog/[slug]] empty sectorId on update, clearing relation');
    return { ok: true, sectorId: null };
  }
  const sector = await prisma.sector.findUnique({
    where: { id: sectorId },
    select: { id: true },
  });
  if (!sector) {
    console.warn('[marketer/blog/[slug]] invalid sectorId on update', { sectorId });
    return { ok: false, status: 400, message: 'Invalid sectorId' };
  }
  return { ok: true, sectorId };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !(await allowMarketerModule(session.user.role as any, 'blogs'))) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { slug } = await params;
    await connectDb();
    const doc = await prisma.news.findUnique({
      where: { slug: slug.trim() },
      include: {
        author: { select: { id: true, email: true, name: true } },
        sector: { select: { id: true, name: true, slug: true } },
        translations: true,
      },
    });
    if (!doc) return NextResponse.json({ message: 'News article not found' }, { status: 404 });
    return NextResponse.json({ item: doc });
  } catch (error) {
    await captureErrorToDb({
      error,
      request: undefined,
      statusCode: 500,
      context: 'marketer/blog/[slug]/GET',
      user: null,
    });
    console.error('Marketer blog(slug) GET error:', error);
    return NextResponse.json(
      process.env.NODE_ENV === 'development' && error instanceof Error
        ? { message: 'Server error', debug: error.message }
        : { message: 'Server error' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !(await allowMarketerModule(session.user.role as any, 'blogs'))) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { slug } = await params;
    const currentSlug = slug.trim();
    if (!currentSlug) return NextResponse.json({ message: 'Invalid slug' }, { status: 400 });

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
    }

    await connectDb();
    const existing = await prisma.news.findUnique({
      where: { slug: currentSlug },
      include: { sector: { select: { slug: true } } },
    });
    if (!existing) return NextResponse.json({ message: 'News article not found' }, { status: 404 });

    const data = newsPatchDataFromBody(body);
    if ('sectorId' in body) {
      const sectorResult = await resolveSectorIdIfProvided(body.sectorId);
      if (!sectorResult.ok) {
        return NextResponse.json({ message: sectorResult.message }, { status: sectorResult.status });
      }
      if (sectorResult.sectorId === null) {
        data.sector = { disconnect: true };
      } else {
        data.sector = { connect: { id: sectorResult.sectorId } };
      }
    }
    if ('scheduledPublishAt' in body) {
      const nextSched = dateOrNull(body.scheduledPublishAt);
      const schedGate = await schedulingForbiddenIfScheduled(nextSched);
      if (schedGate) return schedGate;
      data.scheduledPublishAt = nextSched;
    }
    if ('publishedAt' in body) {
      data.publishedAt =
        typeof body.publishedAt === 'string' && body.publishedAt.trim()
          ? new Date(body.publishedAt)
          : null;
    }

    const doc = await prisma.news.update({
      where: { slug: currentSlug },
      data,
      include: {
        author: { select: { id: true, email: true, name: true } },
        sector: { select: { id: true, name: true, slug: true } },
        translations: true,
      },
    });

    const patches = parseTranslationPatches(body);
    await applyNewsTranslationPatches(doc.id, patches, { title: doc.title, content: doc.content });

    let out = doc;
    if (patches.length > 0) {
      const finalDoc = await prisma.news.findUnique({
        where: { id: doc.id },
        include: {
          author: { select: { id: true, email: true, name: true } },
          sector: { select: { id: true, name: true, slug: true } },
          translations: true,
        },
      });
      out = finalDoc ?? doc;
    }

    if (process.env.BLOG_AUTO_TRANSLATE !== '0' && out.status === 'published') {
      await applyMachineTranslationsFromCanonicalPost({
        id: out.id,
        title: out.title,
        content: out.content,
        excerpt: out.excerpt,
        metaTitle: out.metaTitle,
        metaDescription: out.metaDescription,
        ogTitle: out.ogTitle,
        ogDescription: out.ogDescription,
      });
      const synced = await prisma.news.findUnique({
        where: { id: out.id },
        include: {
          author: { select: { id: true, email: true, name: true } },
          sector: { select: { id: true, name: true, slug: true } },
          translations: true,
        },
      });
      if (synced) out = synced;
    }

    await Promise.all([
      logMarketingActivity({
        userId: session.user.id,
        userEmail: session.user.email ?? '',
        userRole: session.user.role ?? '',
        entity: 'blog',
        entityId: out.id,
        action: 'update',
        seoNote: strOrNull(body.seoNote),
        payload: {
          before: {
            slug: existing.slug,
            title: existing.title,
            status: existing.status,
            sectorId: existing.sectorId ?? null,
          },
          after: {
            slug: out.slug,
            title: out.title,
            status: out.status,
            sectorId: out.sectorId ?? null,
          },
        },
      }),
      logContentEdit({
        userId: session.user.id,
        userEmail: session.user.email ?? '',
        userRole: session.user.role ?? '',
        kind: 'blog',
        targetPath: out.slug,
        summary: `update title length ${out.title.length}, content length ${out.content.length}`,
      }),
    ]);

    if (existing.status !== 'published' && out.status === 'published') {
      void notifyContentPublished({
        kind: 'blog',
        locale: routing.defaultLocale,
        title: out.title,
        slug: out.slug,
        actorUserId: session.user.id,
      }).catch(() => {});
    }

    revalidateCmsPublicSurfaces();
    revalidateNewsPostPublicPaths({
      sectorSlug: out.sector?.slug ?? null,
      articleSlug: out.slug,
      previousSectorSlug: existing.sector?.slug ?? null,
      previousArticleSlug: existing.slug,
    });

    return NextResponse.json({ item: out });
  } catch (error) {
    if (isNewsSlugUniqueViolation(error)) {
      return NextResponse.json(
        { message: 'Another post already uses this slug. Choose a different slug.' },
        { status: 409 },
      );
    }
    await captureErrorToDb({
      error,
      request,
      statusCode: 500,
      context: 'marketer/blog/[slug]/PATCH',
      user: null,
    });
    console.error('Marketer blog(slug) PATCH error:', error);
    return NextResponse.json(
      process.env.NODE_ENV === 'development' && error instanceof Error
        ? { message: 'Server error', debug: error.message }
        : { message: 'Server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !(await allowMarketerModule(session.user.role as any, 'blogs'))) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { slug } = await params;
    const s = slug.trim();
    if (!s) return NextResponse.json({ message: 'Invalid slug' }, { status: 400 });

    await connectDb();
    const existing = await prisma.news.findUnique({
      where: { slug: s },
      include: {
        sector: { select: { slug: true } },
        translations: { select: { content: true, excerpt: true } },
      },
    });
    if (!existing) return NextResponse.json({ message: 'News article not found' }, { status: 404 });

    const storedImageKeys = collectStoredImageKeysFromNews(existing);

    await prisma.news.delete({ where: { slug: s } });

    await deleteOrphanedStoredImagesForKeys(storedImageKeys);
    await Promise.all([
      logMarketingActivity({
        userId: session.user.id,
        userEmail: session.user.email ?? '',
        userRole: session.user.role ?? '',
        entity: 'blog',
        entityId: existing.id,
        action: 'delete',
        payload: { slug: existing.slug, title: existing.title },
      }),
      logContentEdit({
        userId: session.user.id,
        userEmail: session.user.email ?? '',
        userRole: session.user.role ?? '',
        kind: 'blog',
        targetPath: existing.slug,
        summary: 'delete',
      }),
      writeAuditLog({
        request,
        actor: { id: session.user.id, email: session.user.email ?? null, role: session.user.role ?? null },
        action: 'content.news.delete',
        targetType: 'News',
        targetId: existing.id,
        targetLabel: existing.slug,
        payload: { slug: existing.slug, title: existing.title },
      }),
    ]);

    revalidateCmsPublicSurfaces();
    revalidateNewsPostPublicPaths({
      sectorSlug: existing.sector?.slug ?? null,
      articleSlug: existing.slug,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    await captureErrorToDb({
      error,
      request: undefined,
      statusCode: 500,
      context: 'marketer/blog/[slug]/DELETE',
      user: null,
    });
    console.error('Marketer blog(slug) DELETE error:', error);
    return NextResponse.json(
      process.env.NODE_ENV === 'development' && error instanceof Error
        ? { message: 'Server error', debug: error.message }
        : { message: 'Server error' },
      { status: 500 },
    );
  }
}

