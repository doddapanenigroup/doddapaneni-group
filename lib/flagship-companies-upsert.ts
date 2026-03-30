import type * as Db from '@/lib/db';
import flagshipCompanies from '@/lib/data/flagship-companies.json';

export type FlagshipCompanySeed = (typeof flagshipCompanies)[number] & {
  facebookUrl?: string;
  instagramUrl?: string;
  xUrl?: string;
  youtubeUrl?: string;
  pinterestUrl?: string;
};

export async function upsertFlagshipCompaniesFromSeed(
  prismaClient: typeof Db.prisma,
): Promise<{ upserted: string[]; skipped: string[] }> {
  const upserted: string[] = [];
  const skipped: string[] = [];

  for (const cn of flagshipCompanies as FlagshipCompanySeed[]) {
    const c = cn;
    const sector = await prismaClient.sector.findUnique({
      where: { slug: c.sectorSlug },
      select: { id: true },
    });
    if (!sector) {
      skipped.push(c.slug);
      continue;
    }

    await prismaClient.company.upsert({
      where: { slug: c.slug },
      create: {
        name: c.name,
        slug: c.slug,
        sectorId: sector.id,
        logoImage: c.logoImage ?? null,
        description: c.description ?? null,
        facebookUrl: c.facebookUrl?.trim() || null,
        instagramUrl: c.instagramUrl?.trim() || null,
        xUrl: c.xUrl?.trim() || null,
        youtubeUrl: c.youtubeUrl?.trim() || null,
        pinterestUrl: c.pinterestUrl?.trim() || null,
      },
      update: {
        name: c.name,
        sectorId: sector.id,
        logoImage: c.logoImage ?? null,
        description: c.description ?? null,
        facebookUrl: c.facebookUrl?.trim() || null,
        instagramUrl: c.instagramUrl?.trim() || null,
        xUrl: c.xUrl?.trim() || null,
        youtubeUrl: c.youtubeUrl?.trim() || null,
        pinterestUrl: c.pinterestUrl?.trim() || null,
      },
    });
    upserted.push(c.slug);
  }

  return { upserted, skipped };
}
