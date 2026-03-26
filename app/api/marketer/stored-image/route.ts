import { NextResponse } from 'next/server';
import sharp from 'sharp';
import crypto from 'node:crypto';
import path from 'node:path';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import { mediaUrl } from '@/lib/media';
import { logMarketingActivity } from '@/lib/audit-log';

export const runtime = 'nodejs';

const MAX_BYTES = 10 * 1024 * 1024; // 10MB

function allowMarketer(session: { user?: { role?: string } } | null) {
  const role = session?.user?.role;
  return role === 'DIGITAL_MARKETER' || role === 'ADMIN' || role === 'SUPER_ADMIN';
}

function strOrNull(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t.length ? t : null;
}

function safeBaseName(name: string) {
  const base = name.replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return base.length > 0 ? base.slice(0, 80) : 'image';
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !allowMarketer(session)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return NextResponse.json({ message: 'Invalid form data' }, { status: 400 });
    }

    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ message: 'Missing file' }, { status: 400 });
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ message: 'Only image uploads are supported' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ message: 'File too large' }, { status: 413 });
    }

    const originalName = typeof file.name === 'string' ? file.name : 'image';
    const base = safeBaseName(path.basename(originalName, path.extname(originalName)));
    const suffix = crypto.randomBytes(6).toString('hex');
    const fileName = `${base}-${suffix}.webp`;
    const storageKey = `uploads/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);
    let webp: Buffer;
    try {
      webp = await sharp(buf, { failOn: 'none' }).webp({ quality: 82 }).toBuffer();
    } catch {
      return NextResponse.json({ message: 'Failed to process image' }, { status: 400 });
    }

    const altText = strOrNull(form.get('altText'));
    const seoNote = strOrNull(form.get('seoNote'));

    await connectDb();
    const saved = await prisma.storedImage.upsert({
      where: { key: storageKey },
      create: {
        key: storageKey,
        mimeType: 'image/webp',
        data: webp,
        altText,
        fileName,
        size: webp.byteLength,
      },
      update: {
        mimeType: 'image/webp',
        data: webp,
        altText,
        fileName,
        size: webp.byteLength,
      },
    });

    await logMarketingActivity({
      userId: session.user.id,
      userEmail: session.user.email ?? '',
      userRole: session.user.role ?? '',
      entity: 'stored_image',
      entityId: saved.id,
      action: 'create',
      seoNote,
      payload: {
        key: saved.key,
        fileName: saved.fileName,
        altText: saved.altText,
        size: saved.size,
        mimeType: saved.mimeType,
      },
    });

    return NextResponse.json({
      ok: true,
      key: saved.key,
      fileName: saved.fileName,
      altText: saved.altText,
      size: saved.size,
      url: mediaUrl(saved.key),
    });
  } catch (error) {
    console.error('Marketer stored-image POST error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || !allowMarketer(session)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    await connectDb();
    const rows = await prisma.storedImage.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 120,
      select: {
        id: true,
        key: true,
        altText: true,
        fileName: true,
        size: true,
        mimeType: true,
        updatedAt: true,
      },
    });
    return NextResponse.json({
      items: rows.map((r) => ({
        ...r,
        url: mediaUrl(r.key),
        updatedAt: r.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Marketer stored-image GET error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

