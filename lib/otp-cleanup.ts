import { prisma } from "@/lib/db";

export async function cleanupExpiredOtps(now: Date = new Date()) {
  const adminEmployeeCreateOtp = await prisma.adminEmployeeCreateOtp.deleteMany({
    where: { expiresAt: { lt: now } },
  });

  return {
    deleted: {
      adminEmployeeCreateOtp: adminEmployeeCreateOtp.count,
    },
    now: now.toISOString(),
  };
}

