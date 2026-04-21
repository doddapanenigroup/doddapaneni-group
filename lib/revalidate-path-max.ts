import { revalidatePath } from 'next/cache';

/**
 * Invalidate cached HTML/data for a pathname after CMS writes.
 * The second argument must be `layout` or `page` (not a cacheLife name). For App Router
 * routes under dynamic segments (e.g. `/[locale]/news/...`), omitting it can no-op with a
 * console warning — `layout` revalidates that subtree reliably.
 */
export function revalidatePathMax(path: string) {
  revalidatePath(path, 'layout');
}
