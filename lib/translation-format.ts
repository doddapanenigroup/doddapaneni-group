/**
 * Minimal message formatting (build-time strings only — no ICU runtime library).
 * Supports simple `{name}` interpolation and a single `{count, plural, ...}` pattern used in Blog.articlesCount.
 */

function getNested(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((cur, part) => {
    if (cur !== null && typeof cur === 'object' && part in (cur as object)) {
      return (cur as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

/** Minimal plural rule for `{count, plural, one {…} other {…}}` (matches site copy in all locales). */
function pickPluralBranch(template: string, count: number): string {
  const re =
    /\{count\s*,\s*plural\s*,\s*one\s*\{([^}]*)\}\s*other\s*\{([^}]*)\}\s*\}/;
  const m = template.match(re);
  if (!m) return template;
  const [, oneBranch, otherBranch] = m;
  const branch = count === 1 ? oneBranch : otherBranch;
  const resolved = branch.replaceAll('#', String(count));
  return template.replace(m[0], resolved);
}

function interpolateSimple(template: string, values?: Record<string, string | number | boolean>): string {
  if (!values) return template;
  let out = template;
  for (const [k, v] of Object.entries(values)) {
    out = out.replaceAll(`{${k}}`, String(v));
  }
  return out;
}

export type TranslateValues = Record<string, string | number | boolean>;

export function createTranslator(
  messages: Record<string, unknown>,
  namespace?: string,
): (key: string, values?: TranslateValues) => string {
  const base = namespace ? getNested(messages, namespace) : messages;
  const nsObj =
    base !== null && typeof base === 'object' && !Array.isArray(base)
      ? (base as Record<string, unknown>)
      : undefined;

  return (key: string, values?: TranslateValues) => {
    const raw = nsObj ? getNested(nsObj, key) : getNested(messages, key);
    let template = typeof raw === 'string' ? raw : key;
    if (values && typeof values.count === 'number' && template.includes('plural')) {
      template = pickPluralBranch(template, Number(values.count));
    }
    return interpolateSimple(template, values);
  };
}
