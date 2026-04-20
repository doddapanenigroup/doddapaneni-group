import type { Role } from "@/lib/constants";
import { isModuleAllowedForRole } from "@/lib/module-permissions";
import { hasMarketerAccess, isMarketer } from "@/lib/role-utils";

export async function allowMarketerModule(role: Role | undefined, module: "pages" | "blogs") {
  if (!role) return false;
  const base = hasMarketerAccess(role);
  if (!base) return false;
  // Digital marketers manage news/blog posts only, not CMS pages.
  if (isMarketer(role) && module === "pages") return false;
  // Overlay permission (defaults to true if not configured)
  return await isModuleAllowedForRole(role, module);
}

