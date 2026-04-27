import path from "node:path";
import { pathToFileURL } from "node:url";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

// Prisma skips default `.env` loading when `prisma.config.ts` exists — restore it for CLI + adapter.
loadEnv({ path: path.join(process.cwd(), ".env.local"), quiet: true });
loadEnv({ path: path.join(process.cwd(), ".env"), quiet: true });

/** Match `lib/resolve-libsql-database-url.ts`: Prisma CLI resolves `file:./…` from `prisma/`. */
function resolveSqliteFileUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed.toLowerCase().startsWith("file:")) return trimmed;
  const rest = trimmed.slice("file:".length);
  if (rest.startsWith("//")) return trimmed;
  const normalized = rest.replace(/^\.\//, "");
  if (path.isAbsolute(normalized)) {
    return pathToFileURL(normalized).href;
  }
  const schemaDir = path.join(process.cwd(), "prisma");
  return pathToFileURL(path.resolve(schemaDir, normalized)).href;
}

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "node scripts/seed.mjs",
  },
  experimental: {
    adapter: true,
  },
  engine: "js",
  async adapter() {
    if (process.env.PRISMA_PUSH_TARGET === "turso") {
      const url = (process.env.DATABASE_URL || "").trim();
      const authToken = (process.env.TURSO_AUTH_TOKEN || "").trim();
      if (!url || (!url.startsWith("libsql:") && !url.startsWith("https:"))) {
        throw new Error(
          "Turso push: set DATABASE_URL=libsql://… (or https://…) and TURSO_AUTH_TOKEN for this command.",
        );
      }
      if (!authToken) {
        throw new Error("Turso push: set TURSO_AUTH_TOKEN.");
      }
      return new PrismaLibSQL({ url, authToken });
    }

    const raw = (process.env.DATABASE_URL || "").trim();
    if (!raw) {
      throw new Error("Set DATABASE_URL (file:./dev.db or libsql://…) for Prisma CLI commands.");
    }
    if (raw.toLowerCase().startsWith("file:")) {
      return new PrismaLibSQL({
        url: resolveSqliteFileUrl(raw),
        authToken: undefined,
      });
    }
    if (raw.startsWith("libsql:") || raw.startsWith("https:")) {
      const authToken = (process.env.TURSO_AUTH_TOKEN || "").trim();
      if (!authToken) {
        throw new Error("Remote libsql DATABASE_URL requires TURSO_AUTH_TOKEN.");
      }
      return new PrismaLibSQL({ url: raw, authToken });
    }
    throw new Error(`Unsupported DATABASE_URL for Prisma adapter: ${raw.slice(0, 32)}…`);
  },
});
