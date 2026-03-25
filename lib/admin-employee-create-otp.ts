import { createHmac, randomInt, timingSafeEqual } from 'crypto';

const OTP_TTL_MS = 15 * 60 * 1000;

function getSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error('AUTH_SECRET is required');
  return s;
}

export function generateAdminEmployeeCreateOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export function hashAdminEmployeeCreateOtp(adminUserId: string, code: string): string {
  const normalized = code.replace(/\s/g, '');
  return createHmac('sha256', getSecret())
    .update(`admin-employee-create:${adminUserId}:${normalized}`)
    .digest('hex');
}

export function verifyAdminEmployeeCreateOtp(
  storedHash: string,
  adminUserId: string,
  code: string
): boolean {
  const h = hashAdminEmployeeCreateOtp(adminUserId, code);
  try {
    return timingSafeEqual(Buffer.from(storedHash, 'hex'), Buffer.from(h, 'hex'));
  } catch {
    return false;
  }
}

export function adminEmployeeCreateOtpExpiresAt(now = Date.now()): Date {
  return new Date(now + OTP_TTL_MS);
}
