import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  CAMPAIGN_STATUSES,
  connectDb,
  type CampaignStatusValue,
  prisma,
} from '@/lib/db';
import { logMarketingActivity } from '@/lib/audit-log';
import { captureErrorToDb } from '@/lib/error-monitor';
import { writeAuditLog } from '@/lib/audit';
import { hasMarketerAccess } from '@/lib/role-utils';

function allowMarketer(session: { user?: { role?: string } } | null) {
  return hasMarketerAccess(session?.user?.role as any);
}

const STATUSES = CAMPAIGN_STATUSES;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !allowMarketer(session)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    const { id } = await params;
    if (!id?.trim()) {
      return NextResponse.json({ message: 'Invalid id' }, { status: 400 });
    }
    await connectDb();
    const doc = await prisma.campaign.findUnique({ where: { id } });
    if (!doc) return NextResponse.json({ message: 'Campaign not found' }, { status: 404 });
    return NextResponse.json({
      campaign: {
        id: doc.id,
        name: doc.name,
        description: doc.description ?? '',
        url: doc.url,
        status: doc.status,
        startDate: doc.startDate ? doc.startDate.toISOString() : null,
        endDate: doc.endDate ? doc.endDate.toISOString() : null,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    await captureErrorToDb({
      error,
      request: undefined,
      statusCode: 500,
      context: 'marketer/campaigns/[id]/GET',
      user: null,
    });
    console.error('Marketer campaign GET error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !allowMarketer(session)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    const { id } = await params;
    if (!id?.trim()) {
      return NextResponse.json({ message: 'Invalid id' }, { status: 400 });
    }
    let body: {
      name?: string;
      description?: string;
      url?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      seoNote?: string;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
    }
    await connectDb();
    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ message: 'Campaign not found' }, { status: 404 });

    const data: {
      name?: string;
      description?: string;
      url?: string;
      status?: CampaignStatusValue;
      startDate?: Date | null;
      endDate?: Date | null;
    } = {};
    if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim();
    if (typeof body.description === 'string') data.description = body.description.trim();
    if (typeof body.url === 'string' && body.url.trim()) data.url = body.url.trim();
    if (body.status !== undefined && STATUSES.includes(body.status as CampaignStatusValue)) {
      data.status = body.status as CampaignStatusValue;
    }
    if (body.startDate !== undefined) {
      data.startDate = body.startDate ? new Date(body.startDate) : null;
    }
    if (body.endDate !== undefined) {
      data.endDate = body.endDate ? new Date(body.endDate) : null;
    }

    const doc = await prisma.campaign.update({
      where: { id },
      data,
    });
    const seoNote = typeof body.seoNote === 'string' ? body.seoNote.trim() : null;
    await logMarketingActivity({
      userId: session.user.id,
      userEmail: session.user.email ?? '',
      userRole: session.user.role ?? '',
      entity: 'campaign',
      entityId: doc.id,
      action: 'update',
      seoNote,
      payload: {
        before: {
          name: existing.name,
          url: existing.url,
          status: existing.status,
          description: existing.description,
        },
        after: {
          name: doc.name,
          url: doc.url,
          status: doc.status,
          description: doc.description,
        },
      },
    });

    return NextResponse.json({
      campaign: {
        id: doc.id,
        name: doc.name,
        description: doc.description ?? '',
        url: doc.url,
        status: doc.status,
        startDate: doc.startDate ? doc.startDate.toISOString() : null,
        endDate: doc.endDate ? doc.endDate.toISOString() : null,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    await captureErrorToDb({
      error,
      request,
      statusCode: 500,
      context: 'marketer/campaigns/[id]/PATCH',
      user: null,
    });
    console.error('Marketer campaign PATCH error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !allowMarketer(session)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    const { id } = await params;
    if (!id?.trim()) {
      return NextResponse.json({ message: 'Invalid id' }, { status: 400 });
    }
    await connectDb();
    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ message: 'Campaign not found' }, { status: 404 });
    await prisma.campaign.delete({ where: { id } });
    await logMarketingActivity({
      userId: session.user.id,
      userEmail: session.user.email ?? '',
      userRole: session.user.role ?? '',
      entity: 'campaign',
      entityId: id,
      action: 'delete',
      payload: {
        name: existing.name,
        url: existing.url,
        status: existing.status,
      },
    });

    await writeAuditLog({
      request,
      actor: { id: session.user.id, email: session.user.email ?? null, role: session.user.role ?? null },
      action: 'content.campaign.delete',
      targetType: 'Campaign',
      targetId: id,
      targetLabel: existing.name,
      payload: { name: existing.name, url: existing.url, status: existing.status },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    await captureErrorToDb({
      error,
      request: undefined,
      statusCode: 500,
      context: 'marketer/campaigns/[id]/DELETE',
      user: null,
    });
    console.error('Marketer campaign DELETE error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
