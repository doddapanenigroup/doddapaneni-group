import { prisma } from '@/lib/db';
import { mediaUrl } from '@/lib/media';

/** Only delete objects we uploaded to StoredImage (marketer uploads use `uploads/` prefix). */
function isUploadsStorageKey(key: string): boolean {
  const k = key.trim();
  return /^uploads\/[a-zA-Z0-9][a-zA-Z0-9/_\-.]*$/.test(k);
}

/** Extract `uploads/...` key from a public media URL or bare key string. */
export function parseMediaStorageKey(input: string | null | undefined): string | null {
  if (input == null) return null;
  const t = input.trim();
  if (!t) return null;
  const m = t.match(/\/api\/media\/([^?\s#"']+)/i);
  if (m) {
    try {
      return decodeURIComponent(m[1]);
    } catch {
      return m[1];
    }
  }
  const normalized = t.replace(/^\/+/, '');
  if (/^uploads\//i.test(normalized)) return normalized;
  return null;
}

function splitLooseList(s: string | null | undefined): string[] {
  if (!s) return [];
  return s
    .split(/[\s,;|]+/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

/** Find all `/api/media/...` paths inside HTML or plain text blobs. */
export function extractMediaKeysFromHtml(html: string): string[] {
  const keys = new Set<string>();
  const re = /\/api\/media\/([^?\s"'<>]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      keys.add(decodeURIComponent(m[1]));
    } catch {
      keys.add(m[1]);
    }
  }
  return [...keys];
}

type NewsForImageCleanup = {
  content: string;
  featuredImage: string | null;
  bannerImage: string | null;
  galleryImageUrls: string | null;
  infographicUrls: string | null;
  ogImage: string | null;
  translations?: { content: string; excerpt: string | null }[];
};

export function collectStoredImageKeysFromNews(row: NewsForImageCleanup): string[] {
  const set = new Set<string>();
  const addKey = (k: string | null) => {
    if (k && isUploadsStorageKey(k)) set.add(k);
  };
  const addUrl = (s: string | null | undefined) => addKey(parseMediaStorageKey(s));

  addUrl(row.featuredImage);
  addUrl(row.bannerImage);
  addUrl(row.ogImage);
  for (const part of splitLooseList(row.galleryImageUrls)) addUrl(part);
  for (const part of splitLooseList(row.infographicUrls)) addUrl(part);

  for (const k of extractMediaKeysFromHtml(row.content)) addKey(k);
  for (const tr of row.translations ?? []) {
    for (const k of extractMediaKeysFromHtml(tr.content)) addKey(k);
    if (tr.excerpt) {
      for (const k of extractMediaKeysFromHtml(tr.excerpt)) addKey(k);
    }
  }

  return [...set];
}

/** Public path as saved on News rows (relative). Avoid bare `key` in `contains` — substring false positives. */
function canonicalMediaNeedleForKey(key: string): string {
  return mediaUrl(key);
}

async function isMediaKeyStillReferenced(key: string): Promise<boolean> {
  if (!isUploadsStorageKey(key)) return true;
  const needle = canonicalMediaNeedleForKey(key);
  const [newsHits, trHits] = await Promise.all([
    prisma.news.count({
      where: {
        OR: [
          { featuredImage: { contains: needle } },
          { bannerImage: { contains: needle } },
          { ogImage: { contains: needle } },
          { galleryImageUrls: { contains: needle } },
          { infographicUrls: { contains: needle } },
          { content: { contains: needle } },
        ],
      },
    }),
    prisma.newsTranslation.count({
      where: {
        OR: [{ content: { contains: needle } }, { excerpt: { contains: needle } }],
      },
    }),
  ]);
  return newsHits + trHits > 0;
}

/**
 * Deletes StoredImage rows for keys that no longer appear on any News / NewsTranslation row.
 * Call only after the owning News row has been removed (or keys are otherwise unused).
 */
export async function deleteOrphanedStoredImagesForKeys(keys: string[]): Promise<void> {
  const unique = [...new Set(keys)].filter(isUploadsStorageKey);
  for (const key of unique) {
    try {
      if (await isMediaKeyStillReferenced(key)) continue;
      await prisma.storedImage.deleteMany({ where: { key } });
    } catch (e) {
      console.warn('[news-stored-image-cleanup] skip or failed for key', key, e);
    }
  }
}
