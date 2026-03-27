import { cache } from 'react';
import { connectDb, prisma } from '@/lib/db';

/** Public Sector (company) row — single shape for UI, SEO, and APIs. */
export type PublicSector = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

const sectorPublicSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
} as const;

/** Cached: sector landing, division layout, blog post resolution (same request deduped). */
export const getPublicSectorBySlug = cache(async function getPublicSectorBySlug(
  sectorSlug: string,
): Promise<PublicSector | null> {
  await connectDb();
  return prisma.sector.findUnique({
    where: { slug: sectorSlug.trim().toLowerCase() },
    select: sectorPublicSelect,
  });
});

export async function listPublicSectorsBySlugs(
  slugs: readonly string[],
): Promise<Map<string, PublicSector>> {
  await connectDb();
  if (slugs.length === 0) return new Map();
  const rows = await prisma.sector.findMany({
    where: { slug: { in: [...slugs] } },
    select: sectorPublicSelect,
  });
  return new Map(rows.map((r) => [r.slug, r]));
}

export async function listAllPublicSectorsOrdered(): Promise<PublicSector[]> {
  await connectDb();
  return prisma.sector.findMany({
    select: sectorPublicSelect,
    orderBy: { name: 'asc' },
  });
}
