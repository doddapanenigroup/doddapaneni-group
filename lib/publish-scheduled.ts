import { prisma } from "@/lib/db";

/**
 * Promotes any scheduled drafts whose `scheduledPublishAt` is now/past.
 * Also clears `scheduledPublishAt` for already-published rows to avoid re-processing.
 *
 * Idempotent by design (safe to run frequently).
 */
export async function publishScheduledContent(now: Date = new Date()) {
  // Pages: draft -> published
  const pagesPromoted = await prisma.pageContent.updateMany({
    where: {
      status: "draft",
      scheduledPublishAt: { lte: now },
    },
    data: {
      status: "published",
      scheduledPublishAt: null,
    },
  });

  // Pages: cleanup (published but still has a schedule timestamp)
  const pagesScheduleCleared = await prisma.pageContent.updateMany({
    where: {
      status: "published",
      scheduledPublishAt: { lte: now },
    },
    data: {
      scheduledPublishAt: null,
    },
  });

  // Blogs: draft -> published; if publishedAt is missing, set it to now.
  const blogsPromotedAndStamped = await prisma.blog.updateMany({
    where: {
      status: "draft",
      scheduledPublishAt: { lte: now },
      publishedAt: null,
    },
    data: {
      status: "published",
      scheduledPublishAt: null,
      publishedAt: now,
    },
  });

  // Blogs: draft -> published; keep publishedAt if already provided.
  const blogsPromotedButKeepPublishedAt = await prisma.blog.updateMany({
    where: {
      status: "draft",
      scheduledPublishAt: { lte: now },
      publishedAt: { not: null },
    },
    data: {
      status: "published",
      scheduledPublishAt: null,
    },
  });

  // Blogs: cleanup (published but still has a schedule timestamp)
  const blogsScheduleCleared = await prisma.blog.updateMany({
    where: {
      status: "published",
      scheduledPublishAt: { lte: now },
    },
    data: {
      scheduledPublishAt: null,
    },
  });

  return {
    pagesPromoted: pagesPromoted.count,
    pagesScheduleCleared: pagesScheduleCleared.count,
    blogsPromotedAndStamped: blogsPromotedAndStamped.count,
    blogsPromotedButKeepPublishedAt: blogsPromotedButKeepPublishedAt.count,
    blogsScheduleCleared: blogsScheduleCleared.count,
  };
}

