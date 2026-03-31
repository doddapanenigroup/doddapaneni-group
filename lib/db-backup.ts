import { prisma } from '@/lib/prisma';
import crypto from 'node:crypto';

type BackupJson = {
  version: 1;
  createdAt: string;
  includeMedia: boolean;
  tables: Record<string, unknown[]>;
};

function stableStringify(obj: unknown): string {
  // Deterministic enough for our use: JSON with sorted top-level keys.
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    const o = obj as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const k of Object.keys(o).sort()) sorted[k] = o[k];
    return JSON.stringify(sorted);
  }
  return JSON.stringify(obj);
}

export async function buildBackupJson(args: { includeMedia: boolean }): Promise<BackupJson> {
  const includeMedia = !!args.includeMedia;

  const [
    users,
    pages,
    newsArticles,
    storedImages,
    featureToggles,
    roleModulePermissions,
    loginLogs,
    passwordChangeLogs,
    marketingActivityLogs,
    contentEditLogs,
    errorLogs,
    taskExecutionLogs,
    auditLogs,
    visits,
    dashboardVisits,
    developerPageViews,
    loginEmailOtps,
    adminEmployeeCreateOtps,
    userInvites,
  ] = await Promise.all([
    prisma.user.findMany(),
    prisma.pageContent.findMany(),
    prisma.news.findMany() as Promise<unknown[]>,
    prisma.storedImage.findMany({
      select: includeMedia
        ? undefined
        : {
            id: true,
            key: true,
            altText: true,
            fileName: true,
            size: true,
            mimeType: true,
          },
    }) as any,
    prisma.featureToggle.findMany(),
    prisma.roleModulePermission.findMany(),
    prisma.loginLog.findMany(),
    prisma.passwordChangeLog.findMany(),
    prisma.marketingActivityLog.findMany(),
    prisma.contentEditLog.findMany(),
    prisma.errorLog.findMany(),
    prisma.taskExecutionLog.findMany(),
    prisma.auditLog.findMany(),
    prisma.visit.findMany(),
    prisma.dashboardVisit.findMany(),
    prisma.developerPageView.findMany(),
    prisma.loginEmailOtp.findMany(),
    prisma.adminEmployeeCreateOtp.findMany(),
    prisma.userInvite.findMany(),
  ]);

  return {
    version: 1,
    createdAt: new Date().toISOString(),
    includeMedia,
    tables: {
      User: users,
      PageContent: pages,
      News: newsArticles,
      StoredImage: storedImages,
      FeatureToggle: featureToggles,
      RoleModulePermission: roleModulePermissions,
      LoginLog: loginLogs,
      PasswordChangeLog: passwordChangeLogs,
      MarketingActivityLog: marketingActivityLogs,
      ContentEditLog: contentEditLogs,
      ErrorLog: errorLogs,
      TaskExecutionLog: taskExecutionLogs,
      AuditLog: auditLogs,
      Visit: visits,
      DashboardVisit: dashboardVisits,
      DeveloperPageView: developerPageViews,
      LoginEmailOtp: loginEmailOtps,
      AdminEmployeeCreateOtp: adminEmployeeCreateOtps,
      UserInvite: userInvites,
    },
  };
}

export function backupDigest(json: BackupJson): { sha256: string; sizeBytes: number; dataJson: string } {
  const dataJson = stableStringify(json);
  const sha256 = crypto.createHash('sha256').update(dataJson, 'utf8').digest('hex');
  const sizeBytes = Buffer.byteLength(dataJson, 'utf8');
  return { sha256, sizeBytes, dataJson };
}

export async function saveBackupToDb(args: {
  createdBy: { id?: string | null; email?: string | null; role?: string | null } | null;
  label?: string | null;
  includeMedia: boolean;
  dataJson: string;
  sha256: string;
  sizeBytes: number;
}) {
  const row = await prisma.dbBackup.create({
    data: {
      createdById: args.createdBy?.id ?? null,
      createdByEmail: args.createdBy?.email ?? null,
      createdByRole: args.createdBy?.role ?? null,
      label: args.label ?? null,
      includeMedia: !!args.includeMedia,
      sha256: args.sha256,
      sizeBytes: args.sizeBytes,
      dataJson: args.dataJson,
      format: 'json',
    },
    select: {
      id: true,
      createdAt: true,
      createdByEmail: true,
      createdByRole: true,
      label: true,
      includeMedia: true,
      sha256: true,
      sizeBytes: true,
    },
  });
  return row;
}

export function parseBackupJson(text: string): BackupJson {
  const obj = JSON.parse(text) as BackupJson;
  if (!obj || obj.version !== 1 || typeof obj.createdAt !== 'string' || typeof obj.includeMedia !== 'boolean') {
    throw new Error('Invalid backup format');
  }
  if (!obj.tables || typeof obj.tables !== 'object') throw new Error('Invalid backup tables');
  return obj;
}

