import { prisma } from "@/lib/db";

export async function cleanupExpiredOtps(now: Date = new Date()) {
  const [loginEmailOtp, adminEmployeeCreateOtp] = await prisma.$transaction([
    prisma.loginEmailOtp.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.adminEmployeeCreateOtp.deleteMany({ where: { expiresAt: { lt: now } } }),
  ]);

  return {
    deleted: {
      loginEmailOtp: loginEmailOtp.count,
      adminEmployeeCreateOtp: adminEmployeeCreateOtp.count,
    },
    now: now.toISOString(),
  };
}

