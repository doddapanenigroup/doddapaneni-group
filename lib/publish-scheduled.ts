import { prisma } from '@/lib/db';
import { scheduleBlogTranslationSync } from '@/lib/blog-translations-sync';
import { isFeatureEnabled } from '@/lib/features';

let lastAttemptMs: number | null = null;
export type PublishScheduledContentResult = {
  pagesPromoted: number;
  pagesScheduleCleared: number;
  blogsPromoted: number;
  blogsScheduleCleared: number;
};

let inFlight: Promise<PublishScheduledContentResult> | null = null;

/**
 * Promotes any scheduled drafts whose `scheduledPublishAt` is now/past.
 * Also clears `scheduledPublishAt` for already-published rows to avoid re-processing.
 *
 * Idempotent by design (safe to run frequently).
 */
export async function publishScheduledContent(
  now: Date = new Date(),
): Promise<PublishScheduledContentResult> {
  // This function performs DB writes (updates + per-blog translation sync scheduling).
  // During dev, Next can call server components/metadata multiple times per request,
  // which can hammer the database and lead to connection churn.
  //
  // Throttle per process to reduce load while keeping behavior effectively “real-time”
  // for public pages (our route revalidate is ~120s).
  const MIN_INTERVAL_MS = 60_000;
  const ts = Date.now();

  if (inFlight) return inFlight;
  if (lastAttemptMs && ts - lastAttemptMs < MIN_INTERVAL_MS) {
    return {
      pagesPromoted: 0,
      pagesScheduleCleared: 0,
      blogsPromoted: 0,
      blogsScheduleCleared: 0,
    };
  }

  if (!(await isFeatureEnabled('scheduling'))) {
    return {
      pagesPromoted: 0,
      pagesScheduleCleared: 0,
      blogsPromoted: 0,
      blogsScheduleCleared: 0,
    };
  }

  lastAttemptMs = ts;

  inFlight = (async () => {
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
  const dueBlogs = await prisma.news.findMany({
    where: {
      OR: [
        { status: 'draft', scheduledPublishAt: { lte: now } },
        { status: 'scheduled', scheduledPublishAt: { lte: now } },
      ],
    },
    select: { id: true, publishedAt: true },
  });

  let blogsPromoted = 0;
  for (const b of dueBlogs) {
    await prisma.news.update({
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
  const blogsScheduleCleared = await prisma.news.updateMany({
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
  })();

  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}
