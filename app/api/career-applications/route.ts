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

    // Core columns only — avoids 500 when the DB was not migrated with `resume_data*` / `resume_data_present`.
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
      },
    });

    const idsWithResume = new Set<string>();
    try {
      const flagged = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM company_form_submission
        WHERE form_type = 'careers_apply'
          AND resume_data IS NOT NULL
          AND LENGTH(resume_data) > 0
        LIMIT 500
      `;
      for (const row of flagged) idsWithResume.add(row.id);
    } catch (probeErr) {
      console.warn('[career-applications/GET] resume_data column probe failed (ok on older DBs):', probeErr);
    }

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
        resumeDataPresent: idsWithResume.has(r.id),
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
