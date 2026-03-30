import { NextResponse } from 'next/server';
import { publishScheduledContent } from '@/lib/publish-scheduled';
import { getPublicSectorBySlug } from '@/lib/data/sector-repository';
import { listPublishedBlogsForSectorPage } from '@/lib/data/sector-blog-repository';
import { routing } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

/**
 * Public company (sector) by slug. Optional `?blogs=1&limit=12` returns recent published posts for that sector.
 */
export async function GET(request: Request, { params }: Props) {
  const { slug: raw } = await params;
  const slug = raw.trim().toLowerCase();
  if (!slug) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  await publishScheduledContent(new Date());
  const now = new Date();
  const sector = await getPublicSectorBySlug(slug);
  if (!sector) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const url = new URL(request.url);
  const wantBlogs = url.searchParams.get('blogs') === '1' || url.searchParams.get('include') === 'blogs';
  const limitRaw = url.searchParams.get('limit');
  const limit = Math.min(48, Math.max(1, Number.parseInt(limitRaw ?? '12', 10) || 12));
  const localeParam = url.searchParams.get('locale')?.trim().toLowerCase();
  const locale =
    localeParam && routing.locales.includes(localeParam as (typeof routing.locales)[number])
      ? localeParam
      : routing.defaultLocale;

  if (!wantBlogs) {
    return NextResponse.json(
      { sector },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
    );
  }

  const { rows, total } = await listPublishedBlogsForSectorPage({
    sector,
    page: 1,
    pageSize: limit,
    now,
    locale,
  });

  return NextResponse.json(
    {
      sector,
      blogs: { total, items: rows },
    },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
  );
}
