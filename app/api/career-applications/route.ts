import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDb, prisma } from '@/lib/db';
import { canViewCareerApplications } from '@/lib/role-utils';
import type { Role } from '@/lib/constants';

export const dynamic = 'force-dynamic';

type PayloadShape = Record<string, unknown> & {
  jobTitle?: string;
  jobSlug?: string;
  name?: string;
  positionApplied?: string;
  resumeFileName?: string;
};

/**
 * List career job applications (Admin + HR). Excludes large resume blobs.
 */
export async function GET() {
  try {
    const session = await auth();
    const role = session?.user?.role as Role | undefined;
    if (!session?.user?.id || !canViewCareerApplications(role)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDb();
    const rows = await prisma.companyFormSubmission.findMany({
      where: { formType: 'careers_apply' },
      orderBy: { createdAt: 'desc' },
      take: 500,
      select: {
        id: true,
        email: true,
        fullName: true,
        sectorSlug: true,
        payloadJson: true,
        createdAt: true,
        resumeDataPresent: true,
      },
    });

    const items = rows.map((r) => {
      let p: PayloadShape = {};
      try {
        p = JSON.parse(r.payloadJson) as PayloadShape;
      } catch {
        /* keep empty */
      }
      return {
        id: r.id,
        email: r.email,
        fullName: r.fullName,
        jobSlug: p.jobSlug ?? r.sectorSlug,
        jobTitle: p.jobTitle ?? null,
        positionApplied: p.positionApplied ?? null,
        resumeFileName: p.resumeFileName ?? null,
        resumeDataPresent: r.resumeDataPresent,
        createdAt: r.createdAt.toISOString(),
        details: p,
      };
    });

    return NextResponse.json({ items });
  } catch (e) {
    console.error('[career-applications/GET]', e);
    return NextResponse.json({ message: 'Failed to load applications' }, { status: 500 });
  }
}
