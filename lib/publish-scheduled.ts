import { prisma } from '@/lib/db';
import { scheduleBlogTranslationSync } from '@/lib/blog-translations-sync';

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
      status: 'draft',
      scheduledPublishAt: { lte: now },
    },
    data: {
      status: 'published',
      scheduledPublishAt: null,
    },
  });

  // Pages: cleanup (published but still has a schedule timestamp)
  const pagesScheduleCleared = await prisma.pageContent.updateMany({
    where: {
      status: 'published',
      scheduledPublishAt: { lte: now },
    },
    data: {
      scheduledPublishAt: null,
    },
  });

  // Blogs: promote each due draft individually so we can trigger translation sync per post.
  const dueBlogs = await prisma.blog.findMany({
    where: {
      status: 'draft',
      scheduledPublishAt: { lte: now },
    },
    select: { id: true, publishedAt: true },
  });

  let blogsPromoted = 0;
  for (const b of dueBlogs) {
    await prisma.blog.update({
      where: { id: b.id },
      data: {
        status: 'published',
        scheduledPublishAt: null,
        publishedAt: b.publishedAt ?? now,
      },
    });
    blogsPromoted += 1;
    scheduleBlogTranslationSync(b.id);
  }

  // Blogs: cleanup (published but still has a schedule timestamp)
  const blogsScheduleCleared = await prisma.blog.updateMany({
    where: {
      status: 'published',
      scheduledPublishAt: { lte: now },
    },
    data: {
      scheduledPublishAt: null,
    },
  });

  return {
    pagesPromoted: pagesPromoted.count,
    pagesScheduleCleared: pagesScheduleCleared.count,
    blogsPromoted,
    blogsScheduleCleared: blogsScheduleCleared.count,
  };
}
