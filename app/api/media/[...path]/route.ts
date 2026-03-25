import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await context.params;
  if (!segments?.length) {
    return new NextResponse('Not found', { status: 404 });
  }

  const key = segments.map((s) => decodeURIComponent(s)).join('/');
  const row = await prisma.storedImage.findUnique({
    where: { key },
  });

  if (!row) {
    return new NextResponse('Not found', { status: 404 });
  }

  const buf = Buffer.from(row.data);
  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': row.mimeType,
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  });
}
