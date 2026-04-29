import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { listPublicSectorsBySlugs } from '@/lib/data/sector-repository';
import { COMPANY_DIVISION_SLUGS } from '@/lib/company-divisions';
import { corsHeadersForRequest, handleCorsOptions } from '@/lib/site-origin-cors';

const cachedList = unstable_cache(
  async () => {
    const bySlug = await listPublicSectorsBySlugs(COMPANY_DIVISION_SLUGS);
    return COMPANY_DIVISION_SLUGS.map((slug) => bySlug.get(slug)).filter(
      (row): row is NonNullable<typeof row> => row != null,
    );
  },
  ['api-public-sectors-list'],
  { revalidate: 30, tags: ['sectors-public'] },
);

/**
 * Public read-only list of the 12 group sectors (same slugs as routes / mega-menu). DB is source of truth for `isLive`.
 * Cached briefly; `sectors-public` tag is invalidated when admins toggle live state.
 */
export async function OPTIONS(request: Request) {
  return handleCorsOptions(request, { methods: 'GET, OPTIONS' });
}

export async function GET(request: Request) {
  const sectors = await cachedList();
  return NextResponse.json(
    { sectors },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
        ...corsHeadersForRequest(request),
      },
    },
  );
}
