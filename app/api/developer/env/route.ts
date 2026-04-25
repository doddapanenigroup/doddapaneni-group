import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { Role } from "@/lib/constants";
import { getEnvStatus } from "@/lib/env-status";
import { getSafeEnvSnapshot } from "@/lib/safe-env-snapshot";
import { hasDeveloperAccess } from "@/lib/role-utils";

function allowedRole(role: Role | undefined): boolean {
  return hasDeveloperAccess(role);
}

export async function GET() {
  try {
    const session = await auth();
    const role = session?.user?.role as Role | undefined;
    if (!session?.user || !allowedRole(role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Status checks + safe env preview (masked values only).
    return NextResponse.json({
      ...getEnvStatus(),
      safeEnv: getSafeEnvSnapshot(),
    });
  } catch (error) {
    console.error("Developer env GET error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

