import { cache } from 'react';
import { connectDb, prisma } from '@/lib/db';
import { canonicalDivisionDisplayName, isCompanyDivisionSlug } from '@/lib/company-divisions';

/** Public Sector (company) row — single shape for UI, SEO, and APIs. */
export type PublicSector = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isLive: boolean;
};

function publicSectorRow(row: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isLive: boolean;
}): PublicSector {
  const slug = row.slug.trim().toLowerCase();
  const name = isCompanyDivisionSlug(slug)
    ? canonicalDivisionDisplayName(slug, row.name)
    : row.name.trim() || slug;
  return { ...row, slug, name };
}

const sectorPublicSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  isLive: true,
} as const;

/** Cached: sector landing, division layout, blog post resolution (same request deduped). */
export const getPublicSectorBySlug = cache(async function getPublicSectorBySlug(
  sectorSlug: string,
): Promise<PublicSector | null> {
  await connectDb();
  const row = await prisma.sector.findUnique({
    where: { slug: sectorSlug.trim().toLowerCase() },
    select: sectorPublicSelect,
  });
  return row ? publicSectorRow(row) : null;
});

export async function listPublicSectorsBySlugs(
  slugs: readonly string[],
): Promise<Map<string, PublicSector>> {
  await connectDb();
  if (slugs.length === 0) return new Map();
  const normalized = [...new Set(slugs.map((s) => s.trim().toLowerCase()))];
  const rows = await prisma.sector.findMany({
    where: {
      OR: normalized.map((slug) => ({ slug: { equals: slug, mode: 'insensitive' as const } })),
    },
    select: sectorPublicSelect,
  });
  return new Map(
    rows.map((r) => {
      const p = publicSectorRow(r);
      return [p.slug, p] as const;
    }),
  );
}

export async function listAllPublicSectorsOrdered(): Promise<PublicSector[]> {
  await connectDb();
  const rows = await prisma.sector.findMany({
    select: sectorPublicSelect,
    orderBy: { name: 'asc' },
  });
  return rows.map(publicSectorRow);
}
