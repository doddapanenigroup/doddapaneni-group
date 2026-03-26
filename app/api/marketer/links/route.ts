import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  connectDb,
  MARKETING_LINK_TYPES,
  type MarketingLinkTypeValue,
  prisma,
} from '@/lib/db';
import { logMarketingActivity } from '@/lib/audit-log';
import type { MarketingLink } from '@/lib/prisma-generated';
import { captureErrorToDb } from '@/lib/error-monitor';

function allowMarketer(session: { user?: { role?: string } } | null) {
  const role = session?.user?.role;
  return (
    role === 'DIGITAL_MARKETER' ||
    role === 'ADMIN' ||
    role === 'SUPER_ADMIN'
  );
}

const TYPES = MARKETING_LINK_TYPES;

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || !allowMarketer(session)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    await connectDb();
    const list = await prisma.marketingLink.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    const links = (list as MarketingLink[]).map((l) => ({
      id: l.id,
      name: l.name,
      url: l.url,
      description: l.description ?? '',
      type: l.type,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
    }));
    return NextResponse.json({ links });
  } catch (error) {
    await captureErrorToDb({
      error,
      request: undefined,
      statusCode: 500,
      context: 'marketer/links/GET',
      user: null,
    });
    console.error('Marketer links GET error:', error);
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
      url?: string;
      description?: string;
      type?: string;
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
    const type: MarketingLinkTypeValue = TYPES.includes(
      body.type as MarketingLinkTypeValue
    )
      ? (body.type as MarketingLinkTypeValue)
      : 'resource';
    const seoNote = typeof body.seoNote === 'string' ? body.seoNote.trim() : null;

    await connectDb();
    const doc = await prisma.marketingLink.create({
      data: {
        name,
        url,
        description,
        type,
        createdById: session.user.id,
      },
    });
    await logMarketingActivity({
      userId: session.user.id,
      userEmail: session.user.email ?? '',
      userRole: session.user.role ?? '',
      entity: 'marketing_link',
      entityId: doc.id,
      action: 'create',
      seoNote,
      payload: { name: doc.name, url: doc.url, type: doc.type, description: doc.description },
    });
    return NextResponse.json({
      link: {
        id: doc.id,
        name: doc.name,
        url: doc.url,
        description: doc.description ?? '',
        type: doc.type,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    await captureErrorToDb({
      error,
      request,
      statusCode: 500,
      context: 'marketer/links/POST',
      user: null,
    });
    console.error('Marketer links POST error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
