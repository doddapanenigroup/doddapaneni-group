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

type SqlUserRow = {
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

  // SQLite has no Prisma `mode: insensitive` on `equals`; use case-insensitive SQL.
  const rows = trimmed.includes('@')
    ? await prisma.$queryRaw<SqlUserRow[]>`
        SELECT id, email, username, name, role, password_hash AS "passwordHash"
        FROM User
        WHERE LOWER(email) = LOWER(${trimmed})
        LIMIT 1
      `
    : await prisma.$queryRaw<SqlUserRow[]>`
        SELECT id, email, username, name, role, password_hash AS "passwordHash"
        FROM User
        WHERE username IS NOT NULL AND LOWER(username) = LOWER(${trimmed})
        LIMIT 1
      `;

  const doc = rows[0];
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
