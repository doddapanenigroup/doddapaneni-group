import { NextResponse } from 'next/server';
import { publishScheduledContent } from '@/lib/publish-scheduled';
import { listPublicSectorsBySlugs } from '@/lib/data/sector-repository';
import { COMPANY_DIVISION_SLUGS } from '@/lib/company-divisions';

export const dynamic = 'force-dynamic';

/**
 * Public read-only list of the 12 group sectors (same slugs as routes / mega-menu). DB is source of truth for `isLive`.
 */
export async function GET() {
  await publishScheduledContent(new Date());
  const bySlug = await listPublicSectorsBySlugs(COMPANY_DIVISION_SLUGS);
  const sectors = COMPANY_DIVISION_SLUGS.map((slug) => bySlug.get(slug)).filter(
    (row): row is NonNullable<typeof row> => row != null,
  );
  // Must not be cached at CDN/browser: admin toggles `isLive` and the navbar polls every ~5s.
  return NextResponse.json(
    { sectors },
    {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    },
  );
}
