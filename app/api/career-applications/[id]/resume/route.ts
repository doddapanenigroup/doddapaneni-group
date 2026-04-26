import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDb, prisma } from '@/lib/db';
import { canViewCareerApplications } from '@/lib/role-utils';
import type { Role } from '@/lib/constants';

export const dynamic = 'force-dynamic';

function safeFilename(name: string): string {
  const s = name.replace(/[^\w.\-()+ ]/g, '_').trim() || 'resume';
  return s.length > 180 ? s.slice(0, 180) : s;
}

type Params = { params: Promise<{ id: string }> };

/**
 * Download stored resume (Admin + HR). Legacy rows without stored bytes return 404.
 */
export async function GET(_req: Request, { params }: Params) {
  try {
    const session = await auth();
    const role = session?.user?.role as Role | undefined;
    if (!session?.user?.id || !canViewCareerApplications(role)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }

    await connectDb();
    let row: {
      payloadJson: string;
      resumeData: Uint8Array | Buffer | null;
      resumeContentType: string | null;
    } | null;
    try {
      row = await prisma.companyFormSubmission.findFirst({
        where: { id, formType: 'careers_apply' },
        select: { payloadJson: true, resumeData: true, resumeContentType: true },
      });
    } catch (dbErr) {
      console.error('[career-applications/resume/GET] DB query failed', dbErr);
      return NextResponse.json(
        {
          message:
            'Resume download requires an up-to-date database schema (run prisma db push / your Turso push script).',
        },
        { status: 503 },
      );
    }

    if (!row) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }

    const bytes = row.resumeData;
    if (bytes == null) {
      return NextResponse.json(
        { message: 'No resume on file for this application.' },
        { status: 404 },
      );
    }
    const byteLen = Buffer.isBuffer(bytes) ? bytes.length : bytes.byteLength;
    if (byteLen === 0) {
      return NextResponse.json(
        { message: 'No resume on file for this application.' },
        { status: 404 },
      );
    }

    let resumeName = 'resume';
    try {
      const p = JSON.parse(row.payloadJson) as { resumeFileName?: string };
      if (typeof p.resumeFileName === 'string' && p.resumeFileName.trim()) {
        resumeName = safeFilename(p.resumeFileName);
      }
    } catch {
      /* use default */
    }

    const ct = row.resumeContentType?.trim() || 'application/octet-stream';
    const body = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
    return new NextResponse(new Uint8Array(body), {
      status: 200,
      headers: {
        'Content-Type': ct,
        'Content-Disposition': `attachment; filename="${resumeName}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (e) {
    console.error('[career-applications/resume/GET]', e);
    return NextResponse.json({ message: 'Failed to download resume' }, { status: 500 });
  }
}
