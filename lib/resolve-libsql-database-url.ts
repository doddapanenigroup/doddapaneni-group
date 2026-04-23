import path from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Prisma resolves `file:./…` in `schema.prisma` relative to the `prisma/` directory.
 * `@libsql/client` resolves relative `file:` URLs from `process.cwd()`, which breaks
 * `DATABASE_URL=file:./dev.db` when commands run from the repo root (empty `./dev.db`).
 */
export function resolveLibsqlDatabaseUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed.toLowerCase().startsWith("file:")) {
    return trimmed;
  }

  const rest = trimmed.slice("file:".length);
  // file:///… (already absolute URL)
  if (rest.startsWith("//")) {
    return trimmed;
  }

  const normalized = rest.replace(/^\.\//, "");
  if (path.isAbsolute(normalized)) {
    return pathToFileURL(normalized).href;
  }

  const schemaDir = path.join(process.cwd(), "prisma");
  const absolute = path.resolve(schemaDir, normalized);
  return pathToFileURL(absolute).href;
}
