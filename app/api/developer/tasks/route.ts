import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDb, prisma } from "@/lib/db";
import type { Role } from "@/lib/constants";
import { hasDeveloperAccess } from "@/lib/role-utils";

function allowedRole(role: Role | undefined): boolean {
  return hasDeveloperAccess(role);
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    const role = session?.user?.role as Role | undefined;
    if (!session?.user || !allowedRole(role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const take = Math.min(200, Math.max(10, Number(url.searchParams.get("take") || 50)));

    await connectDb();
    const rows = await prisma.taskExecutionLog.findMany({
      orderBy: { startedAt: "desc" },
      take,
      select: {
        id: true,
        taskName: true,
        status: true,
        startedAt: true,
        finishedAt: true,
        durationMs: true,
        message: true,
        detailsJson: true,
      },
    });

    return NextResponse.json({
      items: rows.map((r) => ({
        ...r,
        startedAt: r.startedAt.toISOString(),
        finishedAt: r.finishedAt ? r.finishedAt.toISOString() : null,
      })),
    });
  } catch (error) {
    console.error("Developer tasks GET error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

