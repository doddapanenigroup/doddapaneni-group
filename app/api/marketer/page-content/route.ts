import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import { logMarketingActivity } from '@/lib/audit-log';
import { logContentEdit } from '@/lib/audit-log';

function allowMarketer(session: { user?: { role?: string } } | null) {
  const role = session?.user?.role;
  return role === 'DIGITAL_MARKETER' || role === 'ADMIN' || role === 'SUPER_ADMIN';
}

function strOrNull(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t.length ? t : null;
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || !allowMarketer(session)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const locale = strOrNull(url.searchParams.get('locale')) ?? undefined;

    await connectDb();
    const rows = await prisma.pageContent.findMany({
      where: locale ? { locale } : undefined,
      orderBy: [{ updatedAt: 'desc' }],
    });

    return NextResponse.json({
      items: rows.map((r) => ({
        id: r.id,
        pageKey: r.pageKey,
        slug: r.slug,
        locale: r.locale,
        title: r.title,
        body: r.body,
        status: r.status,
        metaTitle: r.metaTitle,
        metaDescription: r.metaDescription,
        keywords: r.keywords,
        canonicalUrl: r.canonicalUrl,
        ogTitle: r.ogTitle,
        ogDescription: r.ogDescription,
        ogImage: r.ogImage,
        updatedAt: r.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Marketer page-content GET error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !allowMarketer(session)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
    }

    const pageKey = strOrNull(body.pageKey);
    const slug = strOrNull(body.slug);
    const locale = strOrNull(body.locale) ?? 'en';
    const title = strOrNull(body.title);
    const content = typeof body.body === 'string' ? body.body : '';
    const seoNote = strOrNull(body.seoNote);
    const status =
      body.status === 'draft' || body.status === 'published'
        ? (body.status as 'draft' | 'published')
        : 'published';

    if (!pageKey || !slug || !title) {
      return NextResponse.json({ message: 'pageKey, slug and title are required' }, { status: 400 });
    }

    await connectDb();
    const doc = await prisma.pageContent.create({
      data: {
        pageKey,
        slug,
        locale,
        title,
        body: content,
        status,
        metaTitle: strOrNull(body.metaTitle),
        metaDescription: strOrNull(body.metaDescription),
        keywords: strOrNull(body.keywords),
        canonicalUrl: strOrNull(body.canonicalUrl),
        ogTitle: strOrNull(body.ogTitle),
        ogDescription: strOrNull(body.ogDescription),
        ogImage: strOrNull(body.ogImage),
      },
    });

    await logMarketingActivity({
      userId: session.user.id,
      userEmail: session.user.email ?? '',
      userRole: session.user.role ?? '',
      entity: 'page_content',
      entityId: doc.id,
      action: 'create',
      seoNote,
      payload: {
        pageKey: doc.pageKey,
        slug: doc.slug,
        locale: doc.locale,
        title: doc.title,
      },
    });
    await logContentEdit({
      userId: session.user.id,
      userEmail: session.user.email ?? '',
      userRole: session.user.role ?? '',
      kind: 'page_content',
      targetPath: `${doc.slug} (${doc.locale})`,
      summary: `create title length ${doc.title.length}, body length ${doc.body.length}`,
    });

    return NextResponse.json({
      item: {
        id: doc.id,
        pageKey: doc.pageKey,
        slug: doc.slug,
        locale: doc.locale,
        title: doc.title,
        body: doc.body,
        status: doc.status,
        metaTitle: doc.metaTitle,
        metaDescription: doc.metaDescription,
        keywords: doc.keywords,
        canonicalUrl: doc.canonicalUrl,
        ogTitle: doc.ogTitle,
        ogDescription: doc.ogDescription,
        ogImage: doc.ogImage,
        updatedAt: doc.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Marketer page-content POST error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

