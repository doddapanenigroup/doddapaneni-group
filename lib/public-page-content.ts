import { prisma } from '@/lib/prisma';
import { publishScheduledContent } from '@/lib/publish-scheduled';

const PAGE_KEYS = ['home', 'about', 'contact'] as const;

function getCanonicalPageKey(key: string): string | null {
  const k = key.toLowerCase().replace(/\s+/g, '-');
  return PAGE_KEYS.includes(k as (typeof PAGE_KEYS)[number]) ? k : null;
}

function pageKeyToSlugBase(pageKey: string): string {
  return pageKey;
}

function contentSlug(pageKey: string, locale: string): string {
  const base = pageKeyToSlugBase(pageKey);
  return locale === 'en' ? base : `${locale}/${base}`;
}

function slugCandidates(pageKey: string, locale: string, rawPageKey: string): string[] {
  const candidates = new Set<string>();
  const normalizedRaw = rawPageKey.trim().toLowerCase().replace(/^\/+|\/+$/g, '');
  const baseSlug = pageKeyToSlugBase(pageKey);
  candidates.add(contentSlug(pageKey, locale));
  candidates.add(baseSlug);
  candidates.add(pageKey);
  if (normalizedRaw) candidates.add(normalizedRaw);
  return [...candidates].filter(Boolean);
}

function publishedWhere(now: Date) {
  return {
    status: 'published' as const,
    OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: now } }],
  };
}

/**
 * Published CMS page body for public routes (same lookup intent as GET /api/content/[pageKey]).
 * Supports marketer keys outside the static PAGE_KEYS list (e.g. division subpages).
 */
export async function findPublishedPageContent(
  rawPageKey: string,
  localeInput: string,
): Promise<{ title: string; body: string } | null> {
  const locale = (localeInput || 'en').trim().toLowerCase() || 'en';
  const normalized = rawPageKey.trim().toLowerCase().replace(/\s+/g, '-');
  if (!normalized) return null;

  const now = new Date();
  try {
    await publishScheduledContent(now);
  } catch {
    /* non-fatal */
  }

  const canonical = getCanonicalPageKey(normalized) ?? getCanonicalPageKey(rawPageKey);
  const effectivePageKey = canonical ?? normalized;
  const slugs = slugCandidates(effectivePageKey, locale, rawPageKey);

  try {
    const doc = await prisma.pageContent.findFirst({
      where: {
        locale,
        AND: [{ OR: [{ pageKey: effectivePageKey }, { slug: { in: slugs } }] }, publishedWhere(now)],
      },
    });
    if (!doc) return null;
    return { title: doc.title, body: doc.body };
  } catch {
    return null;
  }
}
