import { revalidatePath } from 'next/cache';

/**
 * Next.js 16+ cache invalidation uses cacheLife profiles; `"max"` is always valid.
 * `revalidatePath` typings may still be `layout | page` only — cast at the boundary.
 */
export function revalidatePathMax(path: string) {
  (revalidatePath as (p: string, profile?: string) => void)(path, 'max');
}
