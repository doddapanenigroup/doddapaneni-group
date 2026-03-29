/** Site paths for the News hub (no locale prefix; use with `Link` + `locale` or `publicPathWithLocale`). */

export function newsSectorListPath(sectorSlug: string): string {
  return `/news/${sectorSlug.trim()}`;
}

export function newsArticlePath(sectorSlug: string, articleSlug: string): string {
  return `/news/${sectorSlug.trim()}/${articleSlug.trim()}`;
}
