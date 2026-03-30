import { prisma } from "./prisma";
import {
  connectOncePromise,
  resetConnectOncePromise,
  setConnectOncePromise,
} from "@/lib/db-connection";
import {
  hasAdminAccess,
  isDeveloper,
  isMarketer,
  isSuperAdmin,
} from "@/lib/role-utils";

export { prisma };

export async function connectDb(): Promise<void> {
  // Prisma uses a singleton client (`lib/prisma.ts`). Calling `$connect()` repeatedly
  // can still cause connection churn under concurrent server renders.
  // Connect once per process and reuse the same promise.
  if (!connectOncePromise) {
    const p = prisma.$connect().catch((err) => {
      // Allow retries if the initial connect failed.
      resetConnectOncePromise();
      throw err;
    });
    setConnectOncePromise(p);
  }
  await connectOncePromise;
}

export function isDeveloperRole(role: string): boolean {
  return isDeveloper(role as any);
}

export function isMarketerRole(role: string): boolean {
  return isMarketer(role as any);
}

export function isSuperAdminRole(role: string): boolean {
  return isSuperAdmin(role as any);
}

export function isAdminRole(role: string): boolean {
  return hasAdminAccess(role as any);
}

/** Matches Prisma `CampaignStatus` (use if IDE/@prisma/client enums are stale). */
export type CampaignStatusValue = "draft" | "active" | "paused" | "ended";
export const CAMPAIGN_STATUSES: readonly CampaignStatusValue[] = [
  "draft",
  "active",
  "paused",
  "ended",
];

/** Matches Prisma `MarketingLinkType`. */
export type MarketingLinkTypeValue =
  | "tool"
  | "integration"
  | "resource"
  | "other";
export const MARKETING_LINK_TYPES: readonly MarketingLinkTypeValue[] = [
  "tool",
  "integration",
  "resource",
  "other",
];
