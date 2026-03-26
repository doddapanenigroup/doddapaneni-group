import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { publishScheduledContent } from "@/lib/publish-scheduled";
import { runTaskWithLock } from "@/lib/task-runner";

/**
 * Trigger scheduled publishing.
 *
 * Safety:
 * - In production, requires `CRON_SECRET` to be present.
 * - Must send header `x-cron-secret: <CRON_SECRET>`.
 *
 * You can hit this endpoint from your host cron every few minutes.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (process.env.NODE_ENV === "production") {
    if (!cronSecret) {
      return NextResponse.json({ message: "CRON_SECRET not configured" }, { status: 403 });
    }
    const header = request.headers.get("x-cron-secret");
    if (!header || header !== cronSecret) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
  }

  await connectDb();
  const out = await runTaskWithLock({
    taskName: "publish_scheduled_content",
    run: async () => publishScheduledContent(new Date()),
  });

  return NextResponse.json({ ok: true, ...out });
}

