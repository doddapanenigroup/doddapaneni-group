import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import { logContentEdit } from '@/lib/audit-log';

const PAGE_KEYS = [
  'home',
  'about',
  'services',
  'contact',
  'companies-dealsmedi',
  'companies-dlsin',
  'companies-janatha-mirror',
] as const;

function getPageKey(key: string): string | null {
  const k = key.toLowerCase().replace(/\s+/g, '-');
  return PAGE_KEYS.includes(k as (typeof PAGE_KEYS)[number]) ? k : null;
}

function pageKeyToSlugBase(pageKey: string): string {
  switch (pageKey) {
    case 'companies-dealsmedi':
      return 'companies/dealsmedi';
    case 'companies-dlsin':
      return 'companies/dlsin';
    case 'companies-janatha-mirror':
      return 'companies/janatha-mirror';
    default:
      return pageKey;
  }
}

function contentSlug(pageKey: string, locale: string): string {
  const base = pageKeyToSlugBase(pageKey);
  return locale === 'en' ? base : `${locale}/${base}`;
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
  const locale = url.searchParams.get('locale') || 'en';

  try {
    await connectDb();
    const doc = await prisma.pageContent.findUnique({
      where: { pageKey_locale: { pageKey, locale } },
    });
    if (!doc) {
      return NextResponse.json(null, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      });
    }
    return NextResponse.json(
      {
        title: doc.title,
        body: doc.body,
        updatedAt: doc.updatedAt,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Content GET error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ pageKey: string }> }
) {
  const session = await auth();
  const role = session?.user?.role;
  if (
    !session?.user ||
    (role !== 'DEVELOPER' && role !== 'ADMIN' && role !== 'SUPER_ADMIN')
  ) {
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
      },
      update: { slug: contentSlug(pageKey, locale), title, body: bodyContent },
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
    console.error('Content PUT error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
