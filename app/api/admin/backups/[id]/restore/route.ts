import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import { captureErrorToDb } from '@/lib/error-monitor';
import { parseBackupJson, backupDigest, saveBackupToDb } from '@/lib/db-backup';
import { writeAuditLog } from '@/lib/audit';
import { isSuperAdmin } from '@/lib/role-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = session?.user?.role as string | undefined;
  if (!session?.user?.id || !isSuperAdmin(role as any)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    await connectDb();

    const row = await prisma.dbBackup.findUnique({ where: { id }, select: { id: true, dataJson: true } });
    if (!row) return NextResponse.json({ message: 'Backup not found' }, { status: 404 });

    const body = (await request.json().catch(() => null)) as
      | { mode?: unknown; confirm?: unknown; label?: unknown }
      | null;
    const mode = body?.mode === 'replace' ? 'replace' : 'merge';
    const confirm = typeof body?.confirm === 'string' ? body.confirm.trim() : '';
    if (mode === 'replace' && confirm !== 'RESTORE') {
      return NextResponse.json(
        { message: 'Replace mode requires confirm="RESTORE"' },
        { status: 400 }
      );
    }

    // Always create a safety backup first (no media).
    const safety = await (async () => {
      const json = await (await import('@/lib/db-backup')).buildBackupJson({ includeMedia: false });
      const dig = backupDigest(json);
      return await saveBackupToDb({
        createdBy: { id: session.user.id, email: session.user.email ?? null, role: session.user.role ?? null },
        label: (typeof body?.label === 'string' ? body.label.trim().slice(0, 90) : 'pre-restore') || 'pre-restore',
        includeMedia: false,
        ...dig,
      });
    })();

    const parsed = parseBackupJson(row.dataJson);

    // Restore rules:
    // - merge: upsert by natural keys (id or unique fields), no deletes
    // - replace: deletes most content tables first, then re-inserts from backup
    //
    // This is controlled and logged. We also keep the pre-restore backup above.
    await prisma.$transaction(async (tx) => {
      const t = parsed.tables as any;

      if (mode === 'replace') {
        // Dangerous: clear data tables (keep DbBackup itself).
        // Order is best-effort to satisfy FK constraints.
        await tx.developerPageView.deleteMany({});
        await tx.dashboardVisit.deleteMany({});
        await tx.visit.deleteMany({});
        await tx.loginLog.deleteMany({});
        await tx.passwordChangeLog.deleteMany({});
        await tx.contentEditLog.deleteMany({});
        await tx.marketingActivityLog.deleteMany({});
        await tx.errorLog.deleteMany({});
        await tx.taskExecutionLog.deleteMany({});
        // audit_log is immutable; we do NOT delete/restore it in replace mode.
        await tx.userInvite.deleteMany({});
        await tx.loginEmailOtp.deleteMany({});
        await tx.adminEmployeeCreateOtp.deleteMany({});
        await tx.roleModulePermission.deleteMany({});
        await tx.featureToggle.deleteMany({});
        await tx.blog.deleteMany({});
        await tx.pageContent.deleteMany({});
        // StoredImage: do not delete by default to avoid large binary loss; restore will upsert metadata.
      }

      // Settings tables
      for (const r of (t.FeatureToggle ?? []) as any[]) {
        await tx.featureToggle.upsert({
          where: { name: r.name },
          create: { name: r.name, enabled: !!r.enabled, description: r.description ?? null },
          update: { enabled: !!r.enabled, description: r.description ?? null },
        });
      }
      for (const r of (t.RoleModulePermission ?? []) as any[]) {
        await tx.roleModulePermission.upsert({
          where: { role_module: { role: r.role, module: r.module } } as any,
          create: { role: r.role, module: r.module, allowed: !!r.allowed },
          update: { allowed: !!r.allowed },
        });
      }

      // Content
      for (const p of (t.PageContent ?? []) as any[]) {
        await tx.pageContent.upsert({
          where: { slug: p.slug },
          create: {
            pageKey: p.pageKey,
            slug: p.slug,
            locale: p.locale ?? 'en',
            title: p.title,
            body: p.body,
            status: p.status ?? 'published',
            scheduledPublishAt: p.scheduledPublishAt ? new Date(p.scheduledPublishAt) : null,
            metaTitle: p.metaTitle ?? null,
            metaDescription: p.metaDescription ?? null,
            keywords: p.keywords ?? null,
            canonicalUrl: p.canonicalUrl ?? null,
            ogTitle: p.ogTitle ?? null,
            ogDescription: p.ogDescription ?? null,
            ogImage: p.ogImage ?? null,
          },
          update: {
            pageKey: p.pageKey,
            locale: p.locale ?? 'en',
            title: p.title,
            body: p.body,
            status: p.status ?? 'published',
            scheduledPublishAt: p.scheduledPublishAt ? new Date(p.scheduledPublishAt) : null,
            metaTitle: p.metaTitle ?? null,
            metaDescription: p.metaDescription ?? null,
            keywords: p.keywords ?? null,
            canonicalUrl: p.canonicalUrl ?? null,
            ogTitle: p.ogTitle ?? null,
            ogDescription: p.ogDescription ?? null,
            ogImage: p.ogImage ?? null,
          },
        });
      }

      for (const b of (t.Blog ?? []) as any[]) {
        await tx.blog.upsert({
          where: { slug: b.slug },
          create: {
            title: b.title,
            slug: b.slug,
            content: b.content,
            featuredImage: b.featuredImage ?? null,
            authorId: b.authorId,
            status: b.status ?? 'draft',
            publishedAt: b.publishedAt ? new Date(b.publishedAt) : null,
            scheduledPublishAt: b.scheduledPublishAt ? new Date(b.scheduledPublishAt) : null,
            metaTitle: b.metaTitle ?? null,
            metaDescription: b.metaDescription ?? null,
            keywords: b.keywords ?? null,
            ogTitle: b.ogTitle ?? null,
            ogDescription: b.ogDescription ?? null,
            ogImage: b.ogImage ?? null,
          },
          update: {
            title: b.title,
            content: b.content,
            featuredImage: b.featuredImage ?? null,
            authorId: b.authorId,
            status: b.status ?? 'draft',
            publishedAt: b.publishedAt ? new Date(b.publishedAt) : null,
            scheduledPublishAt: b.scheduledPublishAt ? new Date(b.scheduledPublishAt) : null,
            metaTitle: b.metaTitle ?? null,
            metaDescription: b.metaDescription ?? null,
            keywords: b.keywords ?? null,
            ogTitle: b.ogTitle ?? null,
            ogDescription: b.ogDescription ?? null,
            ogImage: b.ogImage ?? null,
          },
        });
      }

      // Media metadata/binary (optional)
      for (const s of (t.StoredImage ?? []) as any[]) {
        // Key is unique in StoredImage in your system; use that to upsert.
        await tx.storedImage.upsert({
          where: { key: s.key },
          create: {
            key: s.key,
            mimeType: s.mimeType ?? 'image/webp',
            data: s.data ?? undefined,
            altText: s.altText ?? null,
            fileName: s.fileName ?? null,
            size: s.size ?? null,
          } as any,
          update: {
            mimeType: s.mimeType ?? undefined,
            data: s.data ?? undefined,
            altText: s.altText ?? null,
            fileName: s.fileName ?? null,
            size: s.size ?? null,
          } as any,
        });
      }
    });

    await writeAuditLog({
      request,
      actor: { id: session.user.id, email: session.user.email ?? null, role: session.user.role ?? null },
      action: 'db.restore',
      targetType: 'DbBackup',
      targetId: id,
      targetLabel: id,
      payload: { mode, safetyBackupId: safety.id },
    });

    return NextResponse.json({ ok: true, mode, safetyBackupId: safety.id });
  } catch (err) {
    await captureErrorToDb({
      error: err,
      request,
      statusCode: 500,
      user: { id: session.user.id, email: session.user.email ?? null, role: session.user.role ?? null },
      context: 'admin backups restore',
    });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

