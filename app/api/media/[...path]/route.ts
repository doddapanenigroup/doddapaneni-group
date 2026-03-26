import path from 'node:path';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recordApiRequest } from '@/lib/request-monitor';

export const runtime = 'nodejs';

function mimeFromFilename(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.webp') return 'image/webp';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.avif') return 'image/avif';
  if (ext === '.ico') return 'image/x-icon';
  return 'application/octet-stream';
}

/** public/ next to cwd, or parent (e.g. Hostinger / Next standalone layout). */
function publicRoots(): string[] {
  const cwd = process.cwd();
  return [path.join(cwd, 'public'), path.join(cwd, '..', 'public')];
}

function resolveUnderPublic(key: string): string | null {
  if (!key || key.includes('\0')) return null;
  const segments = key.split('/').filter(Boolean);
  if (segments.some((p) => p === '..')) return null;

  for (const root of publicRoots()) {
    const abs = path.resolve(root, ...segments);
    const rel = path.relative(path.resolve(root), abs);
    if (rel.startsWith('..') || path.isAbsolute(rel)) continue;
    if (existsSync(abs)) return abs;
  }
  return null;
}

async function tryPublicFile(key: string): Promise<NextResponse | null> {
  const abs = resolveUnderPublic(key);
  if (!abs) return null;
  try {
    const buf = await readFile(abs);
    const mimeType = mimeFromFilename(key);
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch {
    return null;
  }
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    recordApiRequest({ request: _req, userId: null });
    const { path: segments } = await context.params;
    if (!segments?.length) {
      return new NextResponse('Not found', { status: 404 });
    }

    let key: string;
    try {
      key = segments.map((s) => decodeURIComponent(s)).join('/');
    } catch {
      return new NextResponse('Bad request', { status: 400 });
    }

    const fromDisk = await tryPublicFile(key);
    if (fromDisk) return fromDisk;

    try {
      const row = await prisma.storedImage.findUnique({
        where: { key },
      });
      if (row) {
        const buf = Buffer.from(row.data);
        return new NextResponse(buf, {
          status: 200,
          headers: {
            'Content-Type': row.mimeType,
            'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
          },
        });
      }
    } catch (err) {
      console.error('[api/media] database read failed:', err);
    }

    return new NextResponse('Not found', { status: 404 });
  } catch (err) {
    console.error('[api/media] unhandled error:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
