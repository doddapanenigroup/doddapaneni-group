import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { publishScheduledContent } from '@/lib/publish-scheduled';
import { routing } from '@/i18n/routing';

export type PublicCareerJob = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  applyLabel: string;
  applyUrl: string;
};

async function fetchPublishedJobs(locale: string): Promise<PublicCareerJob[]> {
  const loc = (locale || routing.defaultLocale).toLowerCase();
  const now = new Date();
  try {
    await publishScheduledContent(now);
  } catch {
    /* non-fatal */
  }

  let jobs: Array<{
    slug: string;
    translations: Array<{
      locale: string;
      title: string;
      subtitle: string;
      description: string;
      applyLabel: string;
      applyUrl: string;
    }>;
  }>;
  try {
    jobs = await prisma.careerJob.findMany({
      where: { status: 'published' },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: { translations: true },
    });
  } catch {
    // e.g. migration not applied yet (P2021) — still ship the careers page shell
    return [];
  }

  const fallback = routing.defaultLocale;

  const out: PublicCareerJob[] = [];
  for (const job of jobs) {
    const tr =
      job.translations.find((t) => t.locale === loc) ??
      job.translations.find((t) => t.locale === fallback) ??
      job.translations[0];
    if (!tr) continue;
    out.push({
      slug: job.slug,
      title: tr.title,
      subtitle: tr.subtitle,
      description: tr.description,
      applyLabel: tr.applyLabel,
      applyUrl: tr.applyUrl,
    });
  }
  return out;
}

const getPublishedCareerJobsImpl = unstable_cache(
  async (locale: string) => fetchPublishedJobs(locale),
  ['careers-published-jobs'],
  { revalidate: 60, tags: ['careers-jobs'] },
);

export function getPublishedCareerJobsCached(locale: string) {
  return getPublishedCareerJobsImpl(locale);
}
