import { NextResponse } from 'next/server';
import { publishScheduledContent } from '@/lib/publish-scheduled';
import { listAllPublicSectorsOrdered } from '@/lib/data/sector-repository';

export const dynamic = 'force-dynamic';

/**
 * Public read-only list of companies (Prisma `Sector`). Cached at the edge briefly; DB is source of truth.
 */
export async function GET() {
  await publishScheduledContent(new Date());
  const sectors = await listAllPublicSectorsOrdered();
  return NextResponse.json(
    { sectors },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    },
  );
}
