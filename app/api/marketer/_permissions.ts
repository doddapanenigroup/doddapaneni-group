import type { Role } from "@/lib/constants";
import { isModuleAllowedForRole } from "@/lib/module-permissions";
import { hasMarketerAccess } from "@/lib/role-utils";

export async function allowMarketerModule(role: Role | undefined, module: "pages" | "blogs") {
  if (!role) return false;
  if (!hasMarketerAccess(role)) return false;
  return isModuleAllowedForRole(role, module);
}

