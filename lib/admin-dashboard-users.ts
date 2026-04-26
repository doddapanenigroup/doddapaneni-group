import { connectDb, prisma } from '@/lib/db';
import type { Role } from '@/lib/constants';

export type AdminUserListRow = {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  role: Role;
  createdAt: Date;
  createdAtIST: string | null;
  createdAtET: string | null;
};

/** Normalize DB `role` string for dashboard (tolerates legacy `SUPER_ADMIN`). */
export function normalizeUserRoleFromDb(raw: unknown): Role {
  const v = String(raw ?? '').trim().toUpperCase();
  if (v === 'SUPER_ADMIN') return 'ADMIN';
  if (v === 'ADMIN' || v === 'DEVELOPER' || v === 'DIGITAL_MARKETER' || v === 'HR') return v;
  return 'DEVELOPER';
}

type RawUserRow = {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  role: string;
  createdAt: Date;
  createdAtIST: string | null;
  createdAtET: string | null;
};

async function loadAdminDashboardUserRowsRawSql(): Promise<AdminUserListRow[]> {
  const userDocs = await prisma.$queryRaw<RawUserRow[]>`
    SELECT
      id,
      email,
      username,
      name,
      role,
      created_at AS "createdAt",
      created_at_ist AS "createdAtIST",
      created_at_et AS "createdAtET"
    FROM User
    ORDER BY created_at DESC
  `;
  return userDocs.map((u) => ({
    id: u.id,
    email: u.email,
    username: u.username ?? null,
    name: u.name ?? null,
    role: normalizeUserRoleFromDb(u.role),
    createdAt: u.createdAt,
    createdAtIST: u.createdAtIST ?? null,
    createdAtET: u.createdAtET ?? null,
  }));
}

/**
 * Admin dashboard user table — prefer Prisma `findMany` (same engine path as `/dashboard/employees`).
 * Falls back to raw SQL if the `role` column contains a value Prisma cannot decode as `Role`.
 */
export async function loadAdminDashboardUserRows(): Promise<AdminUserListRow[]> {
  await connectDb();
  try {
    const userDocs = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
        createdAtIST: true,
        createdAtET: true,
      },
    });
    return userDocs.map((u) => ({
      id: u.id,
      email: u.email,
      username: u.username ?? null,
      name: u.name ?? null,
      role: normalizeUserRoleFromDb(u.role),
      createdAt: u.createdAt,
      createdAtIST: u.createdAtIST ?? null,
      createdAtET: u.createdAtET ?? null,
    }));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn('[admin-dashboard-users] findMany failed; using raw SQL. Cause:', msg.slice(0, 200));
    return loadAdminDashboardUserRowsRawSql();
  }
}

export type DashboardShellUserRow = {
  email: string;
  name: string | null;
  username: string | null;
  role: Role;
};

/** Current row from `User` for the signed-in account (header / shell). Tolerates legacy `role` strings. */
export async function loadDashboardShellUserRow(userId: string): Promise<DashboardShellUserRow | null> {
  await connectDb();
  try {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, username: true, role: true },
    });
    if (!u) return null;
    return {
      email: u.email,
      name: u.name ?? null,
      username: u.username ?? null,
      role: normalizeUserRoleFromDb(u.role),
    };
  } catch {
    const rows = await prisma.$queryRaw<Array<{ email: string; name: string | null; username: string | null; role: string }>>`
      SELECT email, name, username, role
      FROM User
      WHERE id = ${userId}
      LIMIT 1
    `;
    const row = rows[0];
    if (!row) return null;
    return {
      email: row.email,
      name: row.name ?? null,
      username: row.username ?? null,
      role: normalizeUserRoleFromDb(row.role),
    };
  }
}
