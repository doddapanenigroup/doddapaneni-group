import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/constants";

export const MODULES = ["pages", "blogs", "developer_tools"] as const;
export type ModuleName = (typeof MODULES)[number];

type CacheKey = `${Role}:${ModuleName}`;

const cache = new Map<CacheKey, { allowed: boolean; ts: number }>();
const TTL_MS = 30_000;

function cacheKey(role: Role, module: ModuleName): CacheKey {
  return `${role}:${module}`;
}

/**
 * Module permission overlay.
 *
 * - If no row exists, defaults to `true` (keeps existing behavior).
 * - This function does NOT replace your role checks. Use it as an extra constraint.
 */
export async function isModuleAllowedForRole(role: Role, module: ModuleName): Promise<boolean> {
  const key = cacheKey(role, module);
  const hit = cache.get(key);
  const now = Date.now();
  if (hit && now - hit.ts < TTL_MS) return hit.allowed;

  try {
    const row = await prisma.roleModulePermission.findUnique({
      where: { role_module: { role: role as any, module } } as any,
      select: { allowed: true },
    });
    const allowed = row?.allowed ?? true;
    cache.set(key, { allowed, ts: now });
    return allowed;
  } catch {
    // If DB is unavailable, fail open to avoid breaking the app.
    return true;
  }
}

export async function setModulePermission(args: { role: Role; module: ModuleName; allowed: boolean }) {
  // Invalidate cache entry
  cache.delete(cacheKey(args.role, args.module));
  return prisma.roleModulePermission.upsert({
    where: { role_module: { role: args.role as any, module: args.module } } as any,
    create: { role: args.role as any, module: args.module, allowed: args.allowed },
    update: { allowed: args.allowed },
  });
}

