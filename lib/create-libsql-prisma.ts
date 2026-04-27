import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/lib/prisma-generated";
import { resolveLibsqlDatabaseUrl } from "@/lib/resolve-libsql-database-url";

type PrismaClientOptions = NonNullable<ConstructorParameters<typeof PrismaClient>[0]>;

/**
 * Single source of truth: **`DATABASE_URL`** in `.env` is the only URL the Next.js app and Prisma
 * runtime use (local `file:./dev.db` or remote `libsql://…`). Remote Turso needs **`TURSO_AUTH_TOKEN`**.
 */
export function createLibsqlPrismaClient(options?: PrismaClientOptions): PrismaClient {
  const rawUrl = process.env.DATABASE_URL?.trim() || "";
  if (!rawUrl) {
    throw new Error(
      "Set DATABASE_URL in .env: file:./dev.db for local SQLite, or libsql://… for Turso (see .env.example). Remote URLs require TURSO_AUTH_TOKEN.",
    );
  }
  if (
    process.env.NODE_ENV === "production" &&
    rawUrl.toLowerCase().startsWith("file:") &&
    process.env.PRISMA_ALLOW_FILE_DATABASE_IN_PRODUCTION !== "1"
  ) {
    // eslint-disable-next-line no-console
    console.warn(
      "[prisma] DATABASE_URL points at a local file in production. Prefer libsql://… + TURSO_AUTH_TOKEN, or set PRISMA_ALLOW_FILE_DATABASE_IN_PRODUCTION=1 to silence this warning.",
    );
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
