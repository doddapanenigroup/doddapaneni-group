import type { Role } from "@/lib/constants";
import { isModuleAllowedForRole } from "@/lib/module-permissions";

export async function allowMarketerModule(role: Role | undefined, module: "pages" | "blogs") {
  const base =
    role === "DIGITAL_MARKETER" || role === "ADMIN" || role === "SUPER_ADMIN";
  if (!base) return false;
  // Overlay permission (defaults to true if not configured)
  return await isModuleAllowedForRole(role, module);
}

