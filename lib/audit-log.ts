import { prisma } from "@/lib/prisma";

export async function logContentEdit(params: {
  userId: string;
  userEmail: string;
  userRole: string;
  kind: "file" | "page_content" | "blog" | "stored_image";
  targetPath: string;
  summary?: string | null;
}) {
  await prisma.contentEditLog.create({
    data: {
      userId: params.userId,
      userEmail: params.userEmail,
      userRole: params.userRole,
      kind: params.kind,
      targetPath: params.targetPath,
      summary: params.summary ?? null,
    },
  });
}

export async function logMarketingActivity(params: {
  userId: string;
  userEmail: string;
  userRole: string;
  entity: "campaign" | "marketing_link" | "page_content" | "blog" | "stored_image";
  entityId: string;
  action: "create" | "update" | "delete";
  seoNote?: string | null;
  payload: unknown;
}) {
  await prisma.marketingActivityLog.create({
    data: {
      userId: params.userId,
      userEmail: params.userEmail,
      userRole: params.userRole,
      entity: params.entity,
      entityId: params.entityId,
      action: params.action,
      seoNote: params.seoNote ?? null,
      payloadJson: JSON.stringify(params.payload ?? null),
    },
  });
}
