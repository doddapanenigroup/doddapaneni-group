import { createHmac, randomInt, timingSafeEqual } from 'crypto';

const OTP_TTL_MS = 15 * 60 * 1000;

function getSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error('AUTH_SECRET is required');
  return s;
}

export function generateLoginEmailOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export function hashLoginEmailOtpCode(userId: string, code: string): string {
  const normalized = code.replace(/\s/g, '');
  return createHmac('sha256', getSecret())
    .update(`${userId}:${normalized}`)
    .digest('hex');
}

export function verifyLoginEmailOtpCode(
  storedHash: string,
  userId: string,
  code: string
): boolean {
  const h = hashLoginEmailOtpCode(userId, code);
  try {
    return timingSafeEqual(Buffer.from(storedHash, 'hex'), Buffer.from(h, 'hex'));
  } catch {
    return false;
  }
}

export function loginEmailOtpExpiresAt(now = Date.now()): Date {
  return new Date(now + OTP_TTL_MS);
}
