import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MODULES, type ModuleName } from "@/lib/module-permissions";
import type { Role } from "@/lib/constants";
import { writeAuditLog } from "@/lib/audit";

function isSuperAdmin(role: Role | undefined) {
  return role === "SUPER_ADMIN";
}

function isRole(value: unknown): value is Role {
  return value === "SUPER_ADMIN" || value === "ADMIN" || value === "DEVELOPER" || value === "DIGITAL_MARKETER";
}

function isModule(value: unknown): value is ModuleName {
  return typeof value === "string" && (MODULES as readonly string[]).includes(value);
}

export async function GET() {
  try {
    const session = await auth();
    const role = session?.user?.role as Role | undefined;
    if (!session?.user || !isSuperAdmin(role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const rows = await prisma.roleModulePermission.findMany({
      orderBy: [{ role: "asc" }, { module: "asc" }],
      select: { role: true, module: true, allowed: true, updatedAt: true },
    });

    return NextResponse.json({ modules: MODULES, items: rows });
  } catch (error) {
    console.error("module-permissions GET error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    const role = session?.user?.role as Role | undefined;
    if (!session?.user || !isSuperAdmin(role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
    }

    const updates = (body as { updates?: unknown }).updates;
    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ message: "updates[] required" }, { status: 400 });
    }

    const normalized: { role: Role; module: ModuleName; allowed: boolean }[] = updates
      .map((u) => ({
        role: (u as any).role as unknown,
        module: (u as any).module as unknown,
        allowed: (u as any).allowed as unknown,
      }))
      .filter((u): u is { role: Role; module: ModuleName; allowed: boolean } => {
        return isRole(u.role) && isModule(u.module) && typeof u.allowed === "boolean";
      })
      .slice(0, 100);

    if (normalized.length === 0) {
      return NextResponse.json({ message: "No valid updates" }, { status: 400 });
    }

    await prisma.$transaction(
      normalized.map((u) =>
        prisma.roleModulePermission.upsert({
          where: { role_module: { role: u.role as any, module: u.module } } as any,
          create: { role: u.role as any, module: u.module as string, allowed: u.allowed },
          update: { allowed: u.allowed },
        })
      )
    );

    await writeAuditLog({
      request,
      actor: {
        id: session.user.id,
        email: session.user.email ?? null,
        role: session.user.role ?? null,
      },
      action: "settings.module_permissions.update",
      targetType: "RoleModulePermission",
      targetId: null,
      targetLabel: null,
      payload: { updates: normalized },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("module-permissions PATCH error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

