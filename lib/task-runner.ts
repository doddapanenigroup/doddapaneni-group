import { prisma } from "@/lib/db";

export type TaskName = "publish_scheduled_content" | "cleanup_expired_otps";

const LEASE_MS = 5 * 60_000;

async function tryAcquireTaskLock(taskName: TaskName): Promise<boolean> {
  const now = new Date();
  const until = new Date(now.getTime() + LEASE_MS);
  try {
    await prisma.cronTaskLock.create({
      data: { taskName, lockedUntil: until },
    });
    return true;
  } catch {
    const stolen = await prisma.cronTaskLock.updateMany({
      where: { taskName, lockedUntil: { lte: now } },
      data: { lockedUntil: until },
    });
    if (stolen.count === 1) return true;
    const row = await prisma.cronTaskLock.findUnique({ where: { taskName } });
    if (!row) {
      try {
        await prisma.cronTaskLock.create({
          data: { taskName, lockedUntil: until },
        });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

async function releaseTaskLock(taskName: TaskName): Promise<void> {
  try {
    await prisma.cronTaskLock.delete({ where: { taskName } });
  } catch {
    /* ignore */
  }
}

export async function runTaskWithLock<T>(args: {
  taskName: TaskName;
  run: () => Promise<T>;
}): Promise<{ status: "success" | "error" | "skipped"; result?: T; error?: string }> {
  let acquired = false;

  try {
    const locked = await tryAcquireTaskLock(args.taskName);
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
      await releaseTaskLock(args.taskName);
    }
  }
}
