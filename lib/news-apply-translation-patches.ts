import type { TranslationPatch } from '@/lib/marketer-news-fields';

/**
 * `/news` is English-only: marketer `translationPatches` are ignored (no `NewsTranslation` writes).
 */
export async function applyNewsTranslationPatches(
  _newsId: string,
  _patches: TranslationPatch[],
  _canonical: { title: string; content: string },
): Promise<void> {
  return;
}
