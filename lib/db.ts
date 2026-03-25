import { prisma } from "./prisma";

export { prisma };

export async function connectDb(): Promise<void> {
  await prisma.$connect();
}

export function isDeveloperRole(role: string): boolean {
  return role === "DEVELOPER";
}

export function isMarketerRole(role: string): boolean {
  return role === "DIGITAL_MARKETER";
}

export function isSuperAdminRole(role: string): boolean {
  return role === "SUPER_ADMIN";
}

export function isAdminRole(role: string): boolean {
  return (
    role === "SUPER_ADMIN" ||
    role === "ADMIN" ||
    role === "DEVELOPER" ||
    role === "DIGITAL_MARKETER"
  );
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
