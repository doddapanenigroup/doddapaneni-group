import { PrismaClient, Prisma } from "@/lib/prisma-generated";
import { resetConnectOncePromise, setConnectOncePromise } from "@/lib/db-connection";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClientType };

/** True when the TCP session was dropped but the app still holds a PrismaClient (common with Neon scale-to-zero / idle timeouts). */
function isStaleConnectionError(e: unknown): boolean {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P1017") {
    return true;
  }
  if (e instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }
  const msg = e instanceof Error ? e.message : String(e);
  return (
    /kind:\s*Closed/i.test(msg) ||
    /Error in PostgreSQL connection/i.test(msg) ||
    /Server has closed the connection/i.test(msg) ||
    /ECONNRESET/i.test(msg) ||
    /Connection terminated unexpectedly/i.test(msg)
  );
}

function isBenignDbLogMessage(message: string, target?: string): boolean {
  const blob = `${message ?? ""} ${target ?? ""}`;
  return (
    /kind:\s*Closed/i.test(blob) ||
    /Error in PostgreSQL connection/i.test(blob) ||
    /Server has closed the connection/i.test(blob)
  );
}

type PrismaClientType = ReturnType<typeof createPrismaClient>;

/** One reconnect at a time — avoids stampedes when many parallel RSC/API calls hit a dead socket. */
let reconnectBarrier: Promise<void> | null = null;

async function reconnectAfterStaleSocket(base: PrismaClient): Promise<void> {
  if (!reconnectBarrier) {
    reconnectBarrier = (async () => {
      try {
        await base.$disconnect();
      } catch {
        /* ignore */
      }
      resetConnectOncePromise();
      await base.$connect();
      setConnectOncePromise(Promise.resolve());
    })().finally(() => {
      reconnectBarrier = null;
    });
  }
  await reconnectBarrier;
}

function createPrismaClient() {
  const isDev = process.env.NODE_ENV === "development";

  // Emit shapes must match `Prisma.LogDefinition` in this client build (no `stderr` emit here).
  const logLevels: Prisma.LogDefinition[] = isDev
    ? [
        { level: "warn", emit: "stdout" },
        // Route errors through $on so we can drop noisy idle "Closed" lines from managed Postgres (Neon).
        { level: "error", emit: "event" },
      ]
    : [{ level: "error", emit: "stdout" }];

  const base = new PrismaClient({
    log: logLevels,
  });

  if (isDev) {
    // @ts-expect-error PrismaClient `$on` event union is inferred as `never` when `log` is typed as `LogDefinition[]`.
    base.$on("error", (e: Prisma.LogEvent) => {
      if (isBenignDbLogMessage(e.message, e.target)) return;
      console.error("[Prisma]", e.message);
    });
  }

  return base.$extends({
    query: {
      async $allOperations({ args, query }) {
        try {
          return await query(args);
        } catch (e) {
          if (!isStaleConnectionError(e)) {
            throw e;
          }
          await reconnectAfterStaleSocket(base);
          return await query(args);
        }
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
