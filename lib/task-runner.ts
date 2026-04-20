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
  let acquired = false;

  try {
    const locked = await tryAdvisoryLock(key);
    if (!locked) {
      return { status: "skipped" };
    }
    acquired = true;

    const result = await args.run();
    return { status: "success", result };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { status: "error", error: msg };
  } finally {
    if (acquired) {
      try {
        await unlock(key);
      } catch {
        // ignore unlock errors
      }
    }
  }
}

