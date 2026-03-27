import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  CAMPAIGN_STATUSES,
  connectDb,
  type CampaignStatusValue,
  prisma,
} from '@/lib/db';
import { logMarketingActivity } from '@/lib/audit-log';
import type { Campaign } from '@/lib/prisma-generated';
import { captureErrorToDb } from '@/lib/error-monitor';
import { hasMarketerAccess } from '@/lib/role-utils';

function allowMarketer(session: { user?: { role?: string } } | null) {
  return hasMarketerAccess(session?.user?.role as any);
}

const STATUSES = CAMPAIGN_STATUSES;

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || !allowMarketer(session)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    await connectDb();
    const list = await prisma.campaign.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    const campaigns = (list as Campaign[]).map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description ?? '',
      url: c.url,
      status: c.status,
      startDate: c.startDate ? c.startDate.toISOString() : null,
      endDate: c.endDate ? c.endDate.toISOString() : null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
    return NextResponse.json({ campaigns });
  } catch (error) {
    await captureErrorToDb({
      error,
      request: undefined,
      statusCode: 500,
      context: 'marketer/campaigns/GET',
      user: null,
    });
    console.error('Marketer campaigns GET error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !allowMarketer(session)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
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
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const url = typeof body.url === 'string' ? body.url.trim() : '';
    if (!name || !url) {
      return NextResponse.json({ message: 'name and url are required' }, { status: 400 });
    }
    const description =
      typeof body.description === 'string' ? body.description.trim() : '';
    const status: CampaignStatusValue = STATUSES.includes(
      body.status as CampaignStatusValue
    )
      ? (body.status as CampaignStatusValue)
      : 'draft';
    const startDate = body.startDate ? new Date(body.startDate) : null;
    const endDate = body.endDate ? new Date(body.endDate) : null;
    const seoNote = typeof body.seoNote === 'string' ? body.seoNote.trim() : null;

    await connectDb();
    const doc = await prisma.campaign.create({
      data: {
        name,
        description,
        url,
        status,
        startDate: startDate && !isNaN(startDate.getTime()) ? startDate : null,
        endDate: endDate && !isNaN(endDate.getTime()) ? endDate : null,
        createdById: session.user.id,
      },
    });
    await logMarketingActivity({
      userId: session.user.id,
      userEmail: session.user.email ?? '',
      userRole: session.user.role ?? '',
      entity: 'campaign',
      entityId: doc.id,
      action: 'create',
      seoNote,
      payload: {
        name: doc.name,
        url: doc.url,
        status: doc.status,
        description: doc.description,
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
      context: 'marketer/campaigns/POST',
      user: null,
    });
    console.error('Marketer campaigns POST error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
