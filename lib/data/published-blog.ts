import type { Prisma } from '@/lib/prisma-generated';

/**
 * Shared Prisma filter for posts visible on the public site (published + schedule honored).
 * Always pair with a fresh `now` after `publishScheduledContent(now)` when serving readers.
 */
export function publishedBlogWhere(now: Date): Prisma.NewsWhereInput {
  return {
    status: 'published',
    OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: now } }],
  };
}

export function publishedBlogWhereForSector(sectorId: string, now: Date): Prisma.NewsWhereInput {
  return {
    ...publishedBlogWhere(now),
    sectorId,
  };
}
