/**
 * Duck-type Prisma unique violations. `instanceof PrismaClientKnownRequestError`
 * can fail across bundles/workers, so rely on `code` + `meta` instead.
 */
function isP2002(error: unknown): error is { code: string; meta?: Record<string, unknown> } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === 'P2002'
  );
}

/** `News` has a single unique column (`slug`). */
export function isNewsSlugUniqueViolation(error: unknown): boolean {
  if (!isP2002(error)) return false;
  const meta = error.meta as { modelName?: string; target?: string | string[] } | undefined;
  if (meta?.modelName === 'News') return true;
  const t = meta?.target;
  if (Array.isArray(t)) return t.includes('slug');
  if (typeof t === 'string') return /slug/i.test(t);
  return false;
}
