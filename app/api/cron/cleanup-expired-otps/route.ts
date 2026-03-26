import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { cleanupExpiredOtps } from "@/lib/otp-cleanup";
import { runTaskWithLock } from "@/lib/task-runner";

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
    taskName: "cleanup_expired_otps",
    run: async () => cleanupExpiredOtps(new Date()),
  });

  return NextResponse.json({ ok: true, ...out });
}

