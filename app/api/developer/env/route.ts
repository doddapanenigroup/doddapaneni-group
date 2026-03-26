import { NextResponse } from "next/server";
import { auth } from "@/auth";
import type { Role } from "@/lib/constants";
import { getEnvStatus } from "@/lib/env-status";

function allowedRole(role: Role | undefined): boolean {
  return role === "DEVELOPER" || role === "ADMIN" || role === "SUPER_ADMIN";
}

export async function GET() {
  try {
    const session = await auth();
    const role = session?.user?.role as Role | undefined;
    if (!session?.user || !allowedRole(role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Status only (no secret values returned).
    return NextResponse.json(getEnvStatus());
  } catch (error) {
    console.error("Developer env GET error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

