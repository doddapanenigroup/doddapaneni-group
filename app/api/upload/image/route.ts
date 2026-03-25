import { NextResponse } from 'next/server';
import sharp from 'sharp';
import crypto from 'node:crypto';
import path from 'node:path';
import { prisma } from '@/lib/prisma';
import { mediaUrl } from '@/lib/media';

export const runtime = 'nodejs';

const MAX_BYTES = 10 * 1024 * 1024; // 10MB

function safeBaseName(name: string) {
  const base = name.replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return base.length > 0 ? base.slice(0, 80) : 'image';
}

export async function POST(req: Request) {
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

  const arrayBuffer = await file.arrayBuffer();
  const buf = Buffer.from(arrayBuffer);

  let webp: Buffer;
  try {
    webp = await sharp(buf, { failOn: 'none' }).webp({ quality: 82 }).toBuffer();
  } catch {
    return NextResponse.json({ message: 'Failed to process image' }, { status: 400 });
  }

  const originalName = typeof file.name === 'string' ? file.name : 'image';
  const base = safeBaseName(path.basename(originalName, path.extname(originalName)));
  const suffix = crypto.randomBytes(6).toString('hex');
  const fileName = `${base}-${suffix}.webp`;
  const storageKey = `uploads/${fileName}`;

  await prisma.storedImage.upsert({
    where: { key: storageKey },
    create: {
      key: storageKey,
      mimeType: 'image/webp',
      data: webp,
    },
    update: {
      mimeType: 'image/webp',
      data: webp,
    },
  });

  const urlPath = mediaUrl(storageKey);
  return NextResponse.json({ ok: true, url: urlPath, fileName, bytes: webp.byteLength });
}
