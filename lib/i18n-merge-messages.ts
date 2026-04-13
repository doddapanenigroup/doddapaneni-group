/**
 * Deep-merge locale JSON onto English so missing keys never render as empty.
 * Does not replace existing strings in the target locale (including English duplicates).
 */
export function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

export function mergeLocaleOntoEnglish(
  english: Record<string, unknown>,
  localeMessages: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const keys = new Set([...Object.keys(english), ...Object.keys(localeMessages)]);
  for (const key of keys) {
    const e = english[key];
    const l = localeMessages[key];
    if (l === undefined) {
      out[key] = e;
      continue;
    }
    if (e === undefined) {
      out[key] = l;
      continue;
    }
    if (isPlainObject(e) && isPlainObject(l)) {
      out[key] = mergeLocaleOntoEnglish(e, l);
    } else {
      out[key] = l;
    }
  }
  return out;
}
