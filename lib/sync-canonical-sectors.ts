import { prisma } from '@/lib/db';
import { COMPANY_DIVISION_SLUGS } from '@/lib/company-divisions';
import canonicalSectors from '@/lib/data/canonical-sectors.json';

export type CanonicalSectorSeed = (typeof canonicalSectors)[number];

/**
 * Keeps `Sector` rows aligned with the 12 app divisions only:
 * - Deletes any sector whose slug is not in `COMPANY_DIVISION_SLUGS` (companies on those rows cascade-delete).
 * - Upserts each canonical row: updates name/description from app data; preserves `isLive` on existing rows.
 * - New rows get `isLive` from seed defaults in `canonical-sectors.json`.
 */
export async function syncCanonicalSectors(): Promise<{
  deletedOrphanSectors: number;
  upserted: number;
}> {
  const allowed = [...COMPANY_DIVISION_SLUGS];
  if (canonicalSectors.length !== allowed.length) {
    throw new Error(
      `canonical-sectors.json must define exactly ${allowed.length} sectors (got ${canonicalSectors.length}).`,
    );
  }
  const seedSlugs = canonicalSectors.map((s) => s.slug.trim().toLowerCase());
  for (let i = 0; i < allowed.length; i++) {
    if (seedSlugs[i] !== allowed[i]) {
      throw new Error(
        `canonical-sectors.json order/slugs must match COMPANY_DIVISION_SLUGS (index ${i}: expected ${allowed[i]}, got ${seedSlugs[i]}).`,
      );
    }
  }

  const { count: deletedOrphanSectors } = await prisma.sector.deleteMany({
    where: { slug: { notIn: allowed } },
  });

  let upserted = 0;
  for (const row of canonicalSectors) {
    await prisma.sector.upsert({
      where: { slug: row.slug },
      create: {
        name: row.name,
        slug: row.slug,
        description: row.description?.trim() || null,
        isLive: Boolean(row.isLive),
      },
      update: {
        name: row.name,
        description: row.description?.trim() || null,
      },
    });
    upserted++;
  }

  return { deletedOrphanSectors, upserted };
}
