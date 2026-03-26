import { prisma } from "@/lib/db";
import { createHash } from "node:crypto";

export type TaskName = "publish_scheduled_content" | "cleanup_expired_otps";

function taskLockKey(taskName: string): bigint {
  // Use first 8 bytes of sha256 as a signed 64-bit advisory lock key.
  const buf = createHash("sha256").update(taskName).digest();
  const first8 = buf.subarray(0, 8);
  // Big-endian to bigint
  let v = 0n;
  for (const b of first8) v = (v << 8n) + BigInt(b);
  // Force into signed range if needed
  if (v > 0x7fff_ffff_ffff_ffffn) v = v - 0x1_0000_0000_0000_0000n;
  return v;
}

async function tryAdvisoryLock(key: bigint): Promise<boolean> {
  const rows = await prisma.$queryRaw<Array<{ locked: boolean }>>`
    SELECT pg_try_advisory_lock(${key}) AS locked
  `;
  return !!rows?.[0]?.locked;
}

async function unlock(key: bigint): Promise<void> {
  await prisma.$queryRaw`SELECT pg_advisory_unlock(${key})`;
}

export async function runTaskWithLock<T>(args: {
  taskName: TaskName;
  run: () => Promise<T>;
}): Promise<{ status: "success" | "error" | "skipped"; result?: T; error?: string }> {
  const key = taskLockKey(args.taskName);
  const startedAt = new Date();
  const startMs = Date.now();

  let logId: string | null = null;

  try {
    // Acquire lock (prevents duplicate runs across instances)
    const locked = await tryAdvisoryLock(key);
    if (!locked) {
      await prisma.taskExecutionLog.create({
        data: {
          taskName: args.taskName,
          status: "skipped",
          startedAt,
          finishedAt: new Date(),
          durationMs: 0,
          message: "Skipped: another instance is already running this task",
        },
      });
      return { status: "skipped" };
    }

    const log = await prisma.taskExecutionLog.create({
      data: { taskName: args.taskName, status: "started", startedAt },
      select: { id: true },
    });
    logId = log.id;

    const result = await args.run();
    const durationMs = Date.now() - startMs;

    await prisma.taskExecutionLog.update({
      where: { id: logId },
      data: {
        status: "success",
        finishedAt: new Date(),
        durationMs,
        detailsJson: JSON.stringify(result ?? null),
      },
    });

    return { status: "success", result };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const durationMs = Date.now() - startMs;
    if (logId) {
      await prisma.taskExecutionLog.update({
        where: { id: logId },
        data: {
          status: "error",
          finishedAt: new Date(),
          durationMs,
          message: msg.slice(0, 8000),
        },
      });
    } else {
      await prisma.taskExecutionLog.create({
        data: {
          taskName: args.taskName,
          status: "error",
          startedAt,
          finishedAt: new Date(),
          durationMs,
          message: msg.slice(0, 8000),
        },
      });
    }
    return { status: "error", error: msg };
  } finally {
    try {
      await unlock(key);
    } catch {
      // ignore unlock errors
    }
  }
}

