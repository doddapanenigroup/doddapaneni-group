import { prisma } from '@/lib/prisma';
import { getIpFromHeaders } from '@/lib/request-monitor';
import { notifyForAuditEntry } from '@/lib/notify';

export type AuditActor = {
  id: string;
  email?: string | null;
  role?: string | null;
};

export async function writeAuditLog(args: {
  request?: Request;
  actor: AuditActor | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  targetLabel?: string | null;
  payload?: unknown;
}) {
  const headers = args.request?.headers;
  const ip = headers ? getIpFromHeaders(headers) : null;
  const userAgent = headers?.get('user-agent') ?? null;
  await prisma.auditLog.create({
    data: {
      actorUserId: args.actor?.id ?? null,
      actorEmail: args.actor?.email ?? null,
      actorRole: args.actor?.role ?? null,
      action: args.action,
      targetType: args.targetType ?? null,
      targetId: args.targetId ?? null,
      targetLabel: args.targetLabel ?? null,
      ipAddress: ip,
      userAgent,
      payloadJson: args.payload == null ? null : JSON.stringify(args.payload),
    },
  });
  void notifyForAuditEntry({
    action: args.action,
    actor: args.actor,
    targetLabel: args.targetLabel,
    payload: args.payload,
  }).catch(() => {});
}

