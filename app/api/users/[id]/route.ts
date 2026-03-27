import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import { formatInIST, formatInET } from '@/lib/date-timezones';
import { sendRoleDeletedEmailToDeleter, sendRoleDeletedEmailToDeletedUser } from '@/lib/email';
import bcrypt from 'bcryptjs';
import { captureErrorToDb } from '@/lib/error-monitor';
import { writeAuditLog } from '@/lib/audit';
import { hasAdminAccess, isAdmin, isSuperAdmin } from '@/lib/role-utils';

const ADMIN_ALLOWED_PASSWORD_CHANGE_ROLES = ['DEVELOPER', 'DIGITAL_MARKETER'] as const;
type AdminAllowedPasswordChangeRole = (typeof ADMIN_ALLOWED_PASSWORD_CHANGE_ROLES)[number];
function isAdminAllowedPasswordChangeRole(
  role: string
): role is AdminAllowedPasswordChangeRole {
  return ADMIN_ALLOWED_PASSWORD_CHANGE_ROLES.includes(role as AdminAllowedPasswordChangeRole);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const role = session?.user?.role;
    const currentUserId = session?.user?.id;
    const isAdminUser = isAdmin(role as any);

    if (!session?.user || !hasAdminAccess(role as any)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    if (!id?.trim()) {
      return NextResponse.json({ message: 'Invalid user id' }, { status: 400 });
    }

    if (id === currentUserId) {
      return NextResponse.json(
        { message: 'Cannot change your own password here. Use profile/settings if available.' },
        { status: 400 }
      );
    }

    let body: { password?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
    }
    const newPassword = typeof body?.password === 'string' ? body.password.trim() : '';
    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    await connectDb();
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const targetRole = user.role as string;
    if (isAdminUser && !isAdminAllowedPasswordChangeRole(targetRole)) {
      return NextResponse.json(
        { message: 'Admin can only change password for Developer or Digital Marketer' },
        { status: 403 }
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const passwordChangedAt = new Date();
    await prisma.user.update({
      where: { id },
      data: { passwordHash, passwordChangedAt },
    });

    if (currentUserId) {
      await prisma.passwordChangeLog.create({
        data: {
          changedById: currentUserId,
          targetUserId: id,
          changedByRole: role ?? '',
          changedAt: passwordChangedAt,
          changedAtIST: formatInIST(passwordChangedAt),
          changedAtET: formatInET(passwordChangedAt),
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    await captureErrorToDb({
      error,
      request,
      statusCode: 500,
      context: 'users/[id]/PATCH',
      user: null,
    });
    console.error('Change password error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const role = session?.user?.role;
    const currentUserId = session?.user?.id;
    const isAdminUser = isAdmin(role as any);

    if (!session?.user || !hasAdminAccess(role as any)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    if (!id?.trim()) {
      return NextResponse.json({ message: 'Invalid user id' }, { status: 400 });
    }

    if (id === currentUserId) {
      return NextResponse.json({ message: 'Cannot delete your own account' }, { status: 400 });
    }

    await connectDb();
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const targetRole = user.role as string;
    if (isSuperAdmin(targetRole as any)) {
      return NextResponse.json({ message: 'Cannot delete Super Admin' }, { status: 403 });
    }
    if (
      isAdminUser &&
      (isAdmin(targetRole as any) || isSuperAdmin(targetRole as any))
    ) {
      return NextResponse.json(
        { message: 'Admin can only delete Developer or Digital Marketer' },
        { status: 403 }
      );
    }

    const deletedUserEmail = user.email;
    const deletedUserName = user.name ?? null;
    const deletedUserRole = targetRole;

    await prisma.$transaction(async (tx) => {
      await tx.passwordChangeLog.deleteMany({
        where: { OR: [{ targetUserId: id }, { changedById: id }] },
      });
      await tx.developerPageView.deleteMany({ where: { userId: id } });
      await tx.dashboardVisit.deleteMany({ where: { userId: id } });
      await tx.marketingActivityLog.deleteMany({ where: { userId: id } });
      await tx.contentEditLog.deleteMany({ where: { userId: id } });
      await tx.webVitalReport.deleteMany({ where: { userId: id } });
      await tx.loginLog.deleteMany({ where: { userId: id } });
      await tx.user.delete({ where: { id } });
    });

    await writeAuditLog({
      request,
      actor: { id: session.user.id, email: session.user.email ?? null, role: session.user.role ?? null },
      action: 'user.delete',
      targetType: 'User',
      targetId: id,
      targetLabel: deletedUserEmail,
      payload: { deletedUserEmail, deletedUserRole },
    });

    const deletedAt = new Date();
    const deleterEmail = session.user.email ?? '';
    const deleterName = session.user.name ?? null;
    const deleterRole = session.user.role ?? '';
    if (deleterEmail) {
      sendRoleDeletedEmailToDeleter(
        deleterEmail,
        deleterRole,
        deletedUserEmail,
        deletedUserName,
        deletedUserRole,
        deletedAt
      ).catch((err) => console.error('Role deleted email to deleter failed:', err));
    }
    sendRoleDeletedEmailToDeletedUser(
      deletedUserEmail,
      deletedUserName,
      deletedUserRole,
      deleterRole,
      deleterName,
      deletedAt
    ).catch((err) => console.error('Role deleted email to deleted user failed:', err));

    return NextResponse.json({ ok: true });
  } catch (error) {
    await captureErrorToDb({
      error,
      request: undefined,
      statusCode: 500,
      context: 'users/[id]/DELETE',
      user: null,
    });
    console.error('Delete user error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
