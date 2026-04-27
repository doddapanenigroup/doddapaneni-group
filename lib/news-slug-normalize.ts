/**
 * Canonical `News.slug` segment: URL paths should not use spaces; marketers sometimes
 * paste a title into the slug field or share links using the title as the last path segment.
 */
export function normalizeStoredNewsSlug(raw: string): string {
  let s = raw.trim();
  try {
    s = decodeURIComponent(s);
  } catch {
    /* keep s as trimmed */
  }
  return s
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const MIN_LOOSE_FOLD_LEN = 2;

/**
 * Collapse to Unicode letters + numbers only so URLs can vary by punctuation, hyphens,
 * spaces, and casing but still resolve to the same post when the fingerprint is unique.
 */
export function foldSlugForLooseMatch(raw: string): string {
  const t = raw.trim();
  if (!t) return '';
  let s = t;
  try {
    s = decodeURIComponent(t);
  } catch {
    s = t;
  }
  return s
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

/** True when the URL segment matches stored slug or slugified title by loose fingerprint (ambiguous → false). */
export function matchesLooseArticleSegment(rawSegment: string, slug: string, title: string): boolean {
  const foldIn = foldSlugForLooseMatch(rawSegment);
  if (foldIn.length < MIN_LOOSE_FOLD_LEN) return false;
  if (foldSlugForLooseMatch(slug) === foldIn) return true;
  if (foldSlugForLooseMatch(normalizeStoredNewsSlug(title)) === foldIn) return true;
  return false;
}
