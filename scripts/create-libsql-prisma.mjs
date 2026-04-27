import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { PrismaClient } from '../lib/prisma-generated/index.js';

/** Keep in sync with `lib/resolve-libsql-database-url.ts`. */
function resolveLibsqlDatabaseUrl(url) {
  const trimmed = String(url).trim();
  if (!trimmed.toLowerCase().startsWith('file:')) return trimmed;
  const rest = trimmed.slice('file:'.length);
  if (rest.startsWith('//')) return trimmed;
  const normalized = rest.replace(/^\.\//, '');
  if (path.isAbsolute(normalized)) {
    return pathToFileURL(normalized).href;
  }
  const schemaDir = path.join(process.cwd(), 'prisma');
  return pathToFileURL(path.resolve(schemaDir, normalized)).href;
}

/**
 * Same wiring as `lib/create-libsql-prisma.ts` for plain Node `scripts/*.mjs`
 * (dotenv must run before the first call).
 */
export function createLibsqlPrismaClient(options = {}) {
  const rawUrl = (process.env.DATABASE_URL || '').trim();
  if (!rawUrl) {
    throw new Error('Set DATABASE_URL (file:./dev.db or libsql://…). Remote needs TURSO_AUTH_TOKEN.');
  }
  const url = resolveLibsqlDatabaseUrl(rawUrl);
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();
  const adapter = new PrismaLibSQL({
    url,
    authToken: authToken || undefined,
  });
  return new PrismaClient({
    adapter,
    ...options,
  });
}
