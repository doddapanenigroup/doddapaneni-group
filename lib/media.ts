/**
 * Public images are stored in PostgreSQL (StoredImage) and served from /api/media/...
 * Use mediaUrl() anywhere you previously used a path like "/doddapaneni-logo.png".
 */
export function mediaUrl(pathFromPublic: string): string {
  const trimmed = pathFromPublic.replace(/^\/+/, '');
  if (!trimmed) return '/api/media';
  return `/api/media/${trimmed.split('/').map(encodeURIComponent).join('/')}`;
}
