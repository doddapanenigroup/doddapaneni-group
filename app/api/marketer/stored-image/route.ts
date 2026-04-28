import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import sharp from 'sharp';
import crypto from 'node:crypto';
import path from 'node:path';
import { auth } from '@/lib/auth';
import { connectDb, prisma } from '@/lib/db';
import { mediaUrl } from '@/lib/media';
import { logMarketingActivity, logContentEdit } from '@/lib/audit-log';
import { captureErrorToDb } from '@/lib/error-monitor';
import { hasMarketerAccess } from '@/lib/role-utils';

export const runtime = 'nodejs';

/** Large uploads / Sharp work — avoid cutting off on default serverless timeouts (e.g. Vercel). */
export const maxDuration = 60;

const MAX_BYTES = 10 * 1024 * 1024; // 10MB

/** Bound decode dimensions / memory for huge camera originals before WebP encode. */
const MAX_DIMENSION_PX = 4096;

function auditStoredImageBestEffort(
  userId: string,
  userEmail: string,
  userRole: string,
  saved: {
    id: string;
    key: string;
    fileName: string | null;
    altText: string | null;
    size: number | null;
    mimeType: string;
  },
  seoNote: string | null,
) {
  void (async () => {
    try {
      await logMarketingActivity({
        userId,
        userEmail,
        userRole,
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
    } catch (e) {
      console.error('[stored-image] logMarketingActivity failed (upload still saved):', e);
    }
    try {
      await logContentEdit({
        userId,
        userEmail,
        userRole,
        kind: 'stored_image',
        targetPath: saved.key,
        summary: `upload ${saved.fileName ?? saved.key}`,
      });
    } catch (e) {
      console.error('[stored-image] logContentEdit failed (upload still saved):', e);
    }
  })();
}

function allowMarketer(session: { user?: { role?: string } } | null) {
  return hasMarketerAccess(session?.user?.role as any);
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
  let sessionForCapture: Session | null = null;
  try {
    const session = await auth();
    sessionForCapture = session;
    if (!session?.user?.id || !allowMarketer(session)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return NextResponse.json(
        {
          message:
            'Could not read the upload (network dropped or body too large). Try a smaller JPG/PNG under 10MB with a stable connection.',
          code: 'FORM_PARSE',
        },
        { status: 400 },
      );
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
      webp = await sharp(buf, { failOn: 'none' })
        .rotate()
        .resize(MAX_DIMENSION_PX, MAX_DIMENSION_PX, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
    } catch {
      return NextResponse.json(
        {
          message:
            'Could not process this image (unsupported format or corrupted file). Try JPG or PNG, or re-export from Photos.',
          code: 'IMAGE_PROCESS',
        },
        { status: 400 },
      );
    }

    const altText = strOrNull(form.get('altText'));
    const seoNote = strOrNull(form.get('seoNote'));

    await connectDb();
    const data = new Uint8Array(webp);
    const saved = await prisma.storedImage.upsert({
      where: { key: storageKey },
      create: {
        key: storageKey,
        mimeType: 'image/webp',
        data,
        altText,
        fileName,
        size: webp.byteLength,
      },
      update: {
        mimeType: 'image/webp',
        data,
        altText,
        fileName,
        size: webp.byteLength,
      },
    });

    auditStoredImageBestEffort(
      session.user.id,
      session.user.email ?? '',
      session.user.role ?? '',
      saved,
      seoNote,
    );

    return NextResponse.json({
      ok: true,
      key: saved.key,
      fileName: saved.fileName,
      altText: saved.altText,
      size: saved.size,
      url: mediaUrl(saved.key),
    });
  } catch (error) {
    await captureErrorToDb({
      error,
      request: req,
      statusCode: 500,
      context: 'marketer/stored-image/POST',
      user: sessionForCapture?.user
        ? {
            id: sessionForCapture.user.id ?? '',
            email: sessionForCapture.user.email,
            role: sessionForCapture.user.role as string | undefined,
          }
        : null,
    });
    console.error('Marketer stored-image POST error:', error);
    return NextResponse.json({ message: 'Server error', code: 'INTERNAL' }, { status: 500 });
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
    await captureErrorToDb({
      error,
      request: undefined,
      statusCode: 500,
      context: 'marketer/stored-image/GET',
      user: null,
    });
    console.error('Marketer stored-image GET error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

