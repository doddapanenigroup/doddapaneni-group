import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const DEFAULT_INVITE_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

function getSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error('AUTH_SECRET is required');
  return s;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function base64UrlEncode(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function generateInviteToken(): string {
  return base64UrlEncode(randomBytes(32));
}

export function hashInviteToken(email: string, token: string): string {
  const e = normalizeEmail(email);
  const t = token.trim();
  return createHmac('sha256', getSecret()).update(`${e}:${t}`).digest('hex');
}

export function verifyInviteToken(storedHash: string, email: string, token: string): boolean {
  const h = hashInviteToken(email, token);
  try {
    return timingSafeEqual(Buffer.from(storedHash, 'hex'), Buffer.from(h, 'hex'));
  } catch {
    return false;
  }
}

export function inviteExpiresAt(ttlMs = DEFAULT_INVITE_TTL_MS, now = Date.now()): Date {
  return new Date(now + ttlMs);
}

