import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import { logContentEdit } from '@/lib/audit-log';
import { publishScheduledContent } from '@/lib/publish-scheduled';
import { captureErrorToDb } from '@/lib/error-monitor';
import { hasDeveloperAccess } from '@/lib/role-utils';

const PAGE_KEYS = ['home', 'about', 'contact'] as const;

function getPageKey(key: string): string | null {
  const k = key.toLowerCase().replace(/\s+/g, '-');
  return PAGE_KEYS.includes(k as (typeof PAGE_KEYS)[number]) ? k : null;
}

function pageKeyToSlugBase(pageKey: string): string {
  return pageKey;
}

function contentSlug(pageKey: string, locale: string): string {
  const base = pageKeyToSlugBase(pageKey);
  return locale === 'en' ? base : `${locale}/${base}`;
}

const CONTENT_CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
} as const;

function publishedWhere(now: Date) {
  return {
    status: 'published' as const,
    OR: [
      { scheduledPublishAt: null },
      { scheduledPublishAt: { lte: now } },
    ],
  };
}

/** Row is publicly readable at `now` (published and not waiting on a future schedule). */
function isPubliclyReadable(
  doc: { status: string; scheduledPublishAt: Date | null },
  now: Date
): boolean {
  if (doc.status !== 'published') return false;
  if (!doc.scheduledPublishAt) return true;
  return doc.scheduledPublishAt.getTime() <= now.getTime();
}

function jsonHeaders() {
  return { headers: CONTENT_CACHE_HEADERS };
}

/** Same shape as a miss (`null`) plus flag so clients can tell DB path failed; still 200 so fetch() succeeds. */
function fallbackPayload(pageKey: string, locale: string, reason: string) {
  console.warn('[content/[pageKey]/GET] fallback', { pageKey, locale, reason });
  return NextResponse.json(
    {
      title: '',
      body: '',
      updatedAt: null,
      fallback: true,
      reason,
    },
    jsonHeaders()
  );
}

function slugCandidates(pageKey: string, locale: string, rawPageKey: string): string[] {
  const candidates = new Set<string>();
  const normalizedRaw = rawPageKey.trim().toLowerCase().replace(/^\/+|\/+$/g, '');
  const baseSlug = pageKeyToSlugBase(pageKey);
  candidates.add(contentSlug(pageKey, locale));
  candidates.add(baseSlug);
  candidates.add(pageKey);
  if (normalizedRaw) candidates.add(normalizedRaw);
  return [...candidates].filter(Boolean);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ pageKey: string }> }
) {
  const { pageKey: raw } = await params;
  const pageKey = getPageKey(raw);
  if (!pageKey) {
    return NextResponse.json({ message: 'Invalid page' }, { status: 400 });
  }

  const url = new URL(_request.url);
  const locale = (url.searchParams.get('locale') || 'en').trim().toLowerCase() || 'en';
  const now = new Date();

  try {
    try {
      await connectDb();
    } catch (dbConnErr) {
      console.error('[content/[pageKey]/GET] connectDb failed', dbConnErr);
      return fallbackPayload(pageKey, locale, 'db_connect');
    }

    try {
      await publishScheduledContent(now);
    } catch (publishErr) {
      console.error('[content/[pageKey]/GET] publishScheduledContent failed', publishErr);
    }

    let doc = null;
    const slugs = slugCandidates(pageKey, locale, raw);
    try {
      doc = await prisma.pageContent.findFirst({
        where: {
          locale,
          AND: [
            { OR: [{ pageKey }, { slug: { in: slugs } }] },
            publishedWhere(now),
          ],
        },
      });
    } catch (qErr) {
      console.error('[content/[pageKey]/GET] findFirst lookup failed', {
        pageKey,
        locale,
        slugCandidates: slugs,
        error: qErr,
      });
    }

    if (!doc) {
      return fallbackPayload(pageKey, locale, 'not_found');
    }

    return NextResponse.json(
      {
        title: doc.title,
        body: doc.body,
        updatedAt: doc.updatedAt,
      },
      jsonHeaders()
    );
  } catch (error) {
    await captureErrorToDb({
      error,
      request: _request,
      statusCode: 500,
      context: 'content/[pageKey]/GET',
      user: null,
    });
    console.error('[content/[pageKey]/GET] unexpected error:', error);
    return fallbackPayload(pageKey, locale, 'unexpected');
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ pageKey: string }> }
) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || !hasDeveloperAccess(role as any)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const { pageKey: raw } = await params;
  const pageKey = getPageKey(raw);
  if (!pageKey) {
    return NextResponse.json({ message: 'Invalid page' }, { status: 400 });
  }

  let payload: { locale?: string; title?: string; body?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }

  const locale = (payload.locale || 'en').trim().toLowerCase();
  const title = typeof payload.title === 'string' ? payload.title : '';
  const bodyContent = typeof payload.body === 'string' ? payload.body : '';

  try {
    await connectDb();
    const doc = await prisma.pageContent.upsert({
      where: { pageKey_locale: { pageKey, locale } },
      create: {
        pageKey,
        slug: contentSlug(pageKey, locale),
        locale,
        title,
        body: bodyContent,
        status: 'published',
      },
      update: { slug: contentSlug(pageKey, locale), title, body: bodyContent, status: 'published' },
    });

    await logContentEdit({
      userId: session.user.id,
      userEmail: session.user.email ?? '',
      userRole: session.user.role ?? '',
      kind: 'page_content',
      targetPath: `${pageKey} (${locale})`,
      summary: `title length ${title.length}, body length ${bodyContent.length}`,
    });

    return NextResponse.json({
      title: doc.title,
      body: doc.body,
      updatedAt: doc.updatedAt,
    });
  } catch (error) {
    await captureErrorToDb({
      error,
      request,
      statusCode: 500,
      context: 'content/[pageKey]/PUT',
      user: session?.user
        ? { id: session.user.id, email: session.user.email ?? null, role: session.user.role ?? null }
        : null,
    });
    console.error('Content PUT error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
