import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/lib/prisma-generated";
import { resolveLibsqlDatabaseUrl } from "@/lib/resolve-libsql-database-url";

type PrismaClientOptions = NonNullable<ConstructorParameters<typeof PrismaClient>[0]>;

export function createLibsqlPrismaClient(options?: PrismaClientOptions): PrismaClient {
  // Match `schema.prisma` (`url = env("DATABASE_URL")`): Prisma CLI uses DATABASE_URL only.
  // Prefer it here too so `db push` and `db:seed` never talk to different DBs when both env vars exist.
  const rawUrl =
    process.env.DATABASE_URL?.trim() ||
    process.env.TURSO_DATABASE_URL?.trim();
  if (!rawUrl) {
    throw new Error(
      "Set DATABASE_URL to your libsql://… Turso URL or file:./dev.db (see .env.example). Optional fallback: TURSO_DATABASE_URL.",
    );
  }
  if (
    process.env.NODE_ENV === "production" &&
    rawUrl.toLowerCase().startsWith("file:") &&
    process.env.PRISMA_ALLOW_FILE_DATABASE_IN_PRODUCTION !== "1"
  ) {
    // eslint-disable-next-line no-console
    console.warn(
      "[prisma] DATABASE_URL points at a local file in production. Dashboard writes (new users, etc.) will not appear in Turso. Prefer libsql://… + TURSO_AUTH_TOKEN, or set PRISMA_ALLOW_FILE_DATABASE_IN_PRODUCTION=1 to silence this warning.",
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
