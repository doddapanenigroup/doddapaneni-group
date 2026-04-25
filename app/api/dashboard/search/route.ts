import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDb, prisma } from '@/lib/db';
import { captureErrorToDb } from '@/lib/error-monitor';
import { recordApiRequest } from '@/lib/request-monitor';
import { hasAdminAccess, isDashboardRole } from '@/lib/role-utils';

function clampTake(n: number) {
  return Math.min(Math.max(n, 1), 15);
}

/** Strip ILIKE wildcards so user input cannot broaden matches unexpectedly. */
function sanitizeSearchQuery(raw: string): string {
  return raw.replace(/[%_\\]/g, ' ').replace(/\s+/g, ' ').trim();
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await auth();
  recordApiRequest({ request, userId: session?.user?.id ?? null });
  const role = (session as { user?: { role?: string } } | null | undefined)?.user?.role;

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  if (!isDashboardRole(role as any)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const qRaw = (url.searchParams.get('q') ?? '').trim();
  const q = sanitizeSearchQuery(qRaw);
  const take = clampTake(Number(url.searchParams.get('limit') ?? '8'));

  if (q.length < 2) {
    return NextResponse.json({
      query: qRaw,
      users: [],
      pages: [],
      news: [],
      sectors: [],
      companies: [],
    });
  }

  try {
    await connectDb();

    const pattern = { contains: q };
    const admin = hasAdminAccess(role as any);

    const [users, pages, newsArticles, sectors, companies] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { email: pattern },
            { name: pattern },
            { username: pattern },
          ],
        },
        take,
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          role: true,
        },
        orderBy: { email: 'asc' },
      }),
      prisma.pageContent.findMany({
        where: {
          OR: [
            { title: pattern },
            { slug: pattern },
            { pageKey: pattern },
            { metaTitle: pattern },
            { metaDescription: pattern },
            { keywords: pattern },
          ],
        },
        take,
        select: {
          id: true,
          title: true,
          slug: true,
          locale: true,
          status: true,
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.news.findMany({
        where: {
          OR: [
            { title: pattern },
            { slug: pattern },
            { metaTitle: pattern },
            { metaDescription: pattern },
            { keywords: pattern },
          ],
        },
        take,
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          sector: { select: { slug: true } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      admin
        ? prisma.sector.findMany({
            where: {
              OR: [{ name: pattern }, { slug: pattern }, { description: pattern }],
            },
            take,
            select: { id: true, name: true, slug: true },
            orderBy: { name: 'asc' },
          })
        : Promise.resolve([]),
      admin
        ? prisma.company.findMany({
            where: {
              OR: [{ name: pattern }, { slug: pattern }, { description: pattern }],
            },
            take,
            select: {
              id: true,
              name: true,
              slug: true,
              sector: { select: { slug: true } },
            },
            orderBy: { name: 'asc' },
          })
        : Promise.resolve([]),
    ]);

    return NextResponse.json({
      query: qRaw,
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        username: u.username,
        role: u.role,
      })),
      pages: pages.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        locale: p.locale,
        status: p.status,
      })),
      news: newsArticles.map((b) => ({
        id: b.id,
        title: b.title,
        slug: b.slug,
        status: b.status,
        sectorSlug: b.sector?.slug ?? null,
      })),
      sectors: sectors.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
      })),
      companies: companies.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        sectorSlug: c.sector?.slug ?? null,
      })),
    });
  } catch (err) {
    await captureErrorToDb({
      error: err,
      request,
      statusCode: 500,
      user: { id: session.user.id, email: session.user.email ?? null, role },
      context: 'dashboard search',
    });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
