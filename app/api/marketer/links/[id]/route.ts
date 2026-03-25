import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  connectDb,
  MARKETING_LINK_TYPES,
  type MarketingLinkTypeValue,
  prisma,
} from '@/lib/db';
import { logMarketingActivity } from '@/lib/audit-log';

function allowMarketer(session: { user?: { role?: string } } | null) {
  const role = session?.user?.role;
  return (
    role === 'DIGITAL_MARKETER' ||
    role === 'ADMIN' ||
    role === 'SUPER_ADMIN'
  );
}

const TYPES = MARKETING_LINK_TYPES;

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
    const doc = await prisma.marketingLink.findUnique({ where: { id } });
    if (!doc) return NextResponse.json({ message: 'Link not found' }, { status: 404 });
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
    console.error('Marketer link GET error:', error);
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
    await connectDb();
    const existing = await prisma.marketingLink.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ message: 'Link not found' }, { status: 404 });

    const data: {
      name?: string;
      url?: string;
      description?: string;
      type?: MarketingLinkTypeValue;
    } = {};
    if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim();
    if (typeof body.url === 'string' && body.url.trim()) data.url = body.url.trim();
    if (typeof body.description === 'string') data.description = body.description.trim();
    if (body.type !== undefined && TYPES.includes(body.type as MarketingLinkTypeValue)) {
      data.type = body.type as MarketingLinkTypeValue;
    }

    const doc = await prisma.marketingLink.update({
      where: { id },
      data,
    });
    const seoNote = typeof body.seoNote === 'string' ? body.seoNote.trim() : null;
    await logMarketingActivity({
      userId: session.user.id,
      userEmail: session.user.email ?? '',
      userRole: session.user.role ?? '',
      entity: 'marketing_link',
      entityId: doc.id,
      action: 'update',
      seoNote,
      payload: {
        before: {
          name: existing.name,
          url: existing.url,
          type: existing.type,
          description: existing.description,
        },
        after: {
          name: doc.name,
          url: doc.url,
          type: doc.type,
          description: doc.description,
        },
      },
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
    console.error('Marketer link PATCH error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
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
    const existing = await prisma.marketingLink.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ message: 'Link not found' }, { status: 404 });
    await prisma.marketingLink.delete({ where: { id } });
    await logMarketingActivity({
      userId: session.user.id,
      userEmail: session.user.email ?? '',
      userRole: session.user.role ?? '',
      entity: 'marketing_link',
      entityId: id,
      action: 'delete',
      payload: {
        name: existing.name,
        url: existing.url,
        type: existing.type,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Marketer link DELETE error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
