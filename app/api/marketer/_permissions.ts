import type { Role } from "@/lib/constants";
import { isModuleAllowedForRole } from "@/lib/module-permissions";
import { hasMarketerAccess } from "@/lib/role-utils";

export async function allowMarketerModule(role: Role | undefined, module: "pages" | "blogs") {
  if (!role) return false;
  const base = hasMarketerAccess(role);
  if (!base) return false;
  // Overlay permission (defaults to true if not configured)
  return await isModuleAllowedForRole(role, module);
}

