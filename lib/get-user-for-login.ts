/**
 * Load user record for password auth: by email (contains @) or by username.
 */

import { prisma } from './prisma';

export type UserRow = {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  role: string;
  passwordHash: string;
};

export async function getUserByLoginIdentifier(raw: string): Promise<UserRow | null> {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Case-insensitive match: legacy rows may not be normalized; PG unique is case-sensitive on text.
  const doc = trimmed.includes('@')
    ? await prisma.user.findFirst({
        where: { email: { equals: trimmed, mode: 'insensitive' } },
      })
    : await prisma.user.findFirst({
        where: { username: { equals: trimmed, mode: 'insensitive' } },
      });

  if (!doc) return null;
  return {
    id: doc.id,
    email: doc.email,
    username: doc.username,
    name: doc.name,
    role: doc.role,
    passwordHash: doc.passwordHash,
  };
}
