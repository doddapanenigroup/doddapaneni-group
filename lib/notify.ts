import { connectDb, prisma } from '@/lib/db';
import { ROLES, type Role } from '@/lib/constants';
import { routing } from '@/i18n/routing';
import { publicPathWithLocale } from '@/lib/sector-landing';

type AuditActorLite = {
  id: string;
  email?: string | null;
  role?: string | null;
};

export const NOTIFICATION_TYPES = {
  PAGE_PUBLISHED: 'page_published',
  ERROR: 'error',
  USER_ACTION: 'user_action',
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

const OPS_ROLES: Role[] = ['SUPER_ADMIN', 'ADMIN', 'DEVELOPER'];

function dashBase() {
  return `/${routing.defaultLocale}/dashboard`;
}

export async function notifyUsersByRoles(args: {
  roles: Role[];
  excludeUserId?: string | null;
  type: NotificationType;
  title: string;
  body?: string | null;
  linkHref?: string | null;
}) {
  try {
    await connectDb();
    const userIds = (
      await prisma.user.findMany({
        where: {
          role: { in: args.roles },
          ...(args.excludeUserId
            ? { id: { not: args.excludeUserId } }
            : {}),
        },
        select: { id: true },
      })
    ).map((u) => u.id);
    if (!userIds.length) return;
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: args.type,
        title: args.title.slice(0, 500),
        body: args.body ? args.body.slice(0, 8000) : null,
        linkHref: args.linkHref ? args.linkHref.slice(0, 2000) : null,
      })),
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('notifyUsersByRoles failed:', e);
  }
}

/** Blog or site page went live (manual publish from marketer APIs). */
export async function notifyContentPublished(args: {
  kind: 'page' | 'blog';
  locale: string;
  title: string;
  slug: string;
  pageKey?: string;
  actorUserId: string;
}) {
  const linkHref =
    args.kind === 'blog'
      ? publicPathWithLocale(args.locale, 'news', args.slug)
      : `${dashBase()}/marketer`;
  const titleText =
    args.kind === 'blog'
      ? `Blog published: ${args.title}`
      : `Page published: ${args.title}`;
  const bodyText =
    args.kind === 'blog'
      ? args.slug
      : [args.pageKey, args.slug, `(${args.locale})`]
          .filter(Boolean)
          .join(' · ');

  await notifyUsersByRoles({
    roles: [...ROLES],
    excludeUserId: args.actorUserId,
    type: NOTIFICATION_TYPES.PAGE_PUBLISHED,
    title: titleText,
    body: bodyText,
    linkHref,
  });
}

export async function notifyServerErrorLogged(args: {
  path: string | null;
  message: string;
  statusCode: number;
}) {
  const path = args.path ?? '(unknown)';
  await notifyUsersByRoles({
    roles: OPS_ROLES,
    type: NOTIFICATION_TYPES.ERROR,
    title: `Server error (${args.statusCode})`,
    body: `${path}\n${args.message}`.slice(0, 8000),
    linkHref: `${dashBase()}/developer`,
  });
}

export async function notifyForAuditEntry(args: {
  action: string;
  actor: AuditActorLite | null;
  targetLabel?: string | null;
  payload?: unknown;
}) {
  const actorEmail = args.actor?.email?.trim() || 'Someone';
  const exclude = args.actor?.id ?? null;
  const adminLink = `${dashBase()}/admin`;

  if (args.action === 'user.role.change') {
    const p = args.payload as { from?: string; to?: string } | null;
    await notifyUsersByRoles({
      roles: OPS_ROLES,
      excludeUserId: exclude,
      type: NOTIFICATION_TYPES.USER_ACTION,
      title: 'User role changed',
      body: `${actorEmail} set ${args.targetLabel ?? 'user'} to ${p?.to ?? '?'} (was ${p?.from ?? '?'}).`,
      linkHref: adminLink,
    });
    return;
  }

  if (args.action === 'user.delete') {
    const p = args.payload as {
      deletedUserEmail?: string;
      deletedUserRole?: string;
    } | null;
    await notifyUsersByRoles({
      roles: OPS_ROLES,
      excludeUserId: exclude,
      type: NOTIFICATION_TYPES.USER_ACTION,
      title: 'User deleted',
      body: `${actorEmail} removed ${p?.deletedUserEmail ?? args.targetLabel ?? 'user'} (${p?.deletedUserRole ?? 'role unknown'}).`,
      linkHref: adminLink,
    });
    return;
  }

  if (args.action === 'db.restore') {
    const p = args.payload as { mode?: string } | null;
    await notifyUsersByRoles({
      roles: OPS_ROLES,
      excludeUserId: exclude,
      type: NOTIFICATION_TYPES.USER_ACTION,
      title: 'Database restore',
      body: `${actorEmail} ran a DB restore${p?.mode ? ` (${p.mode})` : ''}.`,
      linkHref: `${dashBase()}/super-admin`,
    });
  }
}
