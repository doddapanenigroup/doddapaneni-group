import { cache } from 'react';
import { connectDb, prisma } from '@/lib/db';

export type PublicCompany = {
  id: string;
  name: string;
  slug: string;
  logoImage: string | null;
  description: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  xUrl: string | null;
  youtubeUrl: string | null;
  pinterestUrl: string | null;
  sector: { id: string; name: string; slug: string };
};

export const listCompaniesBySectorSlug = cache(async function listCompaniesBySectorSlug(
  sectorSlug: string,
): Promise<PublicCompany[]> {
  await connectDb();
  const slug = sectorSlug.trim().toLowerCase();
  const rows = await prisma.company.findMany({
    where: { sector: { slug } },
    orderBy: [{ name: 'asc' }],
    select: {
      id: true,
      name: true,
      slug: true,
      logoImage: true,
      description: true,
      facebookUrl: true,
      instagramUrl: true,
      xUrl: true,
      youtubeUrl: true,
      pinterestUrl: true,
      sector: { select: { id: true, name: true, slug: true } },
    },
  });
  return rows as unknown as PublicCompany[];
});

export const getCompanyBySlug = cache(async function getCompanyBySlug(
  companySlug: string,
): Promise<PublicCompany | null> {
  await connectDb();
  const slug = companySlug.trim().toLowerCase();
  const row = await prisma.company.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      logoImage: true,
      description: true,
      facebookUrl: true,
      instagramUrl: true,
      xUrl: true,
      youtubeUrl: true,
      pinterestUrl: true,
      sector: { select: { id: true, name: true, slug: true } },
    },
  });
  return (row as unknown as PublicCompany) ?? null;
});

