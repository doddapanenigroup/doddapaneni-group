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

/**
 * Derives a URL path segment from a human-written title (dashboard: auto-slug from heading).
 * Strips punctuation, collapses whitespace and symbols to single hyphens, lowercases.
 */
export function slugifyFromArticleTitle(title: string): string {
  let s = title.trim();
  if (!s) return '';
  try {
    s = decodeURIComponent(s);
  } catch {
    /* keep */
  }
  s = s
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
  s = s
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s;
}

/**
 * Normalizes clipboard content for the dashboard slug field: full URLs use the last path
 * segment; path-only URLs use the last segment; everything else is slugified like a title.
 */
export function slugifyPastedForUrlField(pasted: string): string {
  let raw = pasted.trim();
  if (!raw) return '';
  try {
    raw = decodeURIComponent(raw);
  } catch {
    /* keep */
  }

  if (raw.startsWith('/')) {
    const segments = raw.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    if (last) {
      const s = slugifyFromArticleTitle(last);
      if (s) return s;
    }
  }

  try {
    const urlStr = raw.startsWith('//')
      ? `https:${raw}`
      : /^www\./i.test(raw)
        ? `https://${raw}`
        : raw;
    if (/^https?:\/\//i.test(urlStr)) {
      const u = new URL(urlStr);
      const segments = u.pathname.split('/').filter(Boolean);
      const last = segments[segments.length - 1] ?? '';
      if (last) {
        let seg = last;
        try {
          seg = decodeURIComponent(seg);
        } catch {
          /* keep */
        }
        const s = slugifyFromArticleTitle(seg);
        if (s) return s;
      }
    }
  } catch {
    /* fall through */
  }

  return slugifyFromArticleTitle(raw);
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
