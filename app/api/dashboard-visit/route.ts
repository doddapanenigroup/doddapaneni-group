import { NextResponse } from 'next/server';
import { getServerSession } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import { formatInIST, formatInET } from '@/lib/date-timezones';
import type { Role } from '@/lib/constants';
import { ROLES } from '@/lib/constants';
import type { Role as DbRole } from '@/lib/prisma-generated';
import { isDashboardRole } from '@/lib/role-utils';

/** First-class segments we document; others may still be valid URL slugs. */
const KNOWN_DASHBOARD_SEGMENTS = new Set([
  'dashboard',
  'super-admin',
  'admin',
  'developer',
  'marketer',
  'employees',
  'analytics',
  'security',
]);

const DEFAULT_PATH = 'dashboard';

function toDbRole(role: Role): DbRole {
  return role as DbRole;
}

function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

/**
 * Safe dashboard path: lowercase slug, or default. Allows [a-z0-9-] for new routes without API churn.
 */
function normalizePath(raw: unknown): string {
  if (typeof raw !== 'string') return DEFAULT_PATH;
  const s = raw.trim().toLowerCase().replace(/^\/+|\/+$/g, '');
  if (!s) return DEFAULT_PATH;
  if (KNOWN_DASHBOARD_SEGMENTS.has(s)) return s;
  if (/^[a-z0-9-]{1,64}$/.test(s)) return s;
  return DEFAULT_PATH;
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function POST(request: Request) {
  const session = await getServerSession();
  const role = session?.user?.role as Role | undefined;
  console.info('[dashboard-visit] auth check', {
    hasSession: Boolean(session?.user?.id),
    userId: session?.user?.id ?? null,
    role: role ?? null,
  });

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  if (!isDashboardRole(role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  let rawBody: Record<string, unknown> = {};
  try {
    const text = await request.text();
    if (text?.trim()) {
      rawBody = JSON.parse(text) as Record<string, unknown>;
    }
  } catch {
    rawBody = {};
  }

  const bodyPath = asString(rawBody.path);
  const bodyRole = asString(rawBody.role);
  const bodyUserId = asString(rawBody.userId);

  /** Body hints only; `userId` / role always come from the session for writes. */
  const missingBodyFields: string[] = [];
  if (!bodyPath) missingBodyFields.push('path');

  const path = normalizePath(bodyPath ?? DEFAULT_PATH);
  const userId = session.user.id;
  const safeRole: Role = isRole(session.user.role) ? session.user.role : role!;
  const mismatchedBodyIdentity =
    (bodyUserId != null && bodyUserId !== session.user.id) ||
    (bodyRole != null && bodyRole !== safeRole);

  const uaHeader = request.headers.get('user-agent');
  const userAgent =
    typeof uaHeader === 'string' && uaHeader.length > 0 ? uaHeader.slice(0, 512) : null;

  console.info('[dashboard-visit] incoming request', {
    received: {
      path: rawBody.path,
      role: rawBody.role,
      userId: rawBody.userId,
      userAgent: rawBody.userAgent,
    },
    missingBodyFields,
    bodyIdentityMismatch: mismatchedBodyIdentity,
    resolved: { path, role: safeRole, userId, userAgentLen: userAgent?.length ?? 0 },
  });

  try {
    await connectDb();

    const visitedAt = new Date();
    await prisma.dashboardVisit.create({
      data: {
        userId,
        path,
        role: toDbRole(safeRole),
        visitedAt,
        visitedAtIST: formatInIST(visitedAt),
        visitedAtET: formatInET(visitedAt),
        userAgent,
      },
    });

    return NextResponse.json({ ok: true, path, role: safeRole, userId });
  } catch (error) {
    console.error('Dashboard visit error:', error);
    return NextResponse.json({ message: 'Failed to record dashboard visit' }, { status: 500 });
  }
}
