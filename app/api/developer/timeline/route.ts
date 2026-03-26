import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDb, prisma } from "@/lib/db";
import type { Role } from "@/lib/constants";

function allowedRole(role: Role | undefined): boolean {
  return role === "DEVELOPER" || role === "ADMIN" || role === "SUPER_ADMIN";
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    const role = session?.user?.role as Role | undefined;
    if (!session?.user || !allowedRole(role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get("userId")?.trim() || undefined;
    const filterRole = url.searchParams.get("role")?.trim() || undefined;
    const take = Math.min(200, Math.max(10, Number(url.searchParams.get("take") || 80)));

    await connectDb();

    const [users, contentEdits, marketing] = await Promise.all([
      prisma.user.findMany({
        where: filterRole ? { role: filterRole as any } : undefined,
        select: { id: true, email: true, name: true, role: true },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.contentEditLog.findMany({
        where: userId ? { userId } : undefined,
        orderBy: { createdAt: "desc" },
        take,
      }),
      prisma.marketingActivityLog.findMany({
        where: userId ? { userId } : undefined,
        orderBy: { createdAt: "desc" },
        take,
      }),
    ]);

    const items = [
      ...contentEdits.map((e) => ({
        id: `content:${e.id}`,
        ts: e.createdAt.toISOString(),
        source: "ContentEditLog" as const,
        userId: e.userId,
        userEmail: e.userEmail,
        userRole: e.userRole,
        action:
          e.kind === "page_content"
            ? "page edit"
            : e.kind === "blog"
            ? "blog edit"
            : e.kind === "file"
            ? "user updates"
            : "edit",
        title: `${e.kind} — ${e.targetPath}`,
        detail: e.summary ?? null,
      })),
      ...marketing.map((m) => ({
        id: `marketing:${m.id}`,
        ts: m.createdAt.toISOString(),
        source: "MarketingActivityLog" as const,
        userId: m.userId,
        userEmail: m.userEmail,
        userRole: m.userRole,
        action:
          m.entity === "blog" && m.action === "create"
            ? "blog creation"
            : m.entity === "page_content" && m.action === "update"
            ? "page edit"
            : `${m.entity} ${m.action}`,
        title: `${m.entity} — ${m.action}`,
        detail: m.seoNote ?? null,
      })),
    ]
      .sort((a, b) => b.ts.localeCompare(a.ts))
      .slice(0, take);

    // Optional role filter on timeline (based on stored role strings)
    const filtered = filterRole ? items.filter((i) => i.userRole === filterRole) : items;

    return NextResponse.json({
      users,
      items: filtered,
    });
  } catch (error) {
    console.error("Developer timeline GET error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

