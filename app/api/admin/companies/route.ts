import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { revalidatePathMax } from '@/lib/revalidate-path-max';
import { auth } from '@/auth';
import { connectDb, prisma } from '@/lib/db';
import { captureErrorToDb } from '@/lib/error-monitor';
import { hasAdminAccess } from '@/lib/role-utils';
import { COMPANY_DIVISION_SLUGS } from '@/lib/company-divisions';
import { routing } from '@/i18n/routing';
import type { Role } from '@/lib/constants';
import * as z from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAdminRole(role: unknown) {
  return hasAdminAccess(role as Role | null | undefined);
}

function revalidateCompanyPublicRoutes(targetSectorSlug?: string | null, targetCompanySlug?: string | null) {
  try {
    revalidatePath('/', 'layout');
    revalidatePath('/companies', 'layout');
    const sectorSlugs = targetSectorSlug
      ? [targetSectorSlug.trim().toLowerCase()]
      : [...COMPANY_DIVISION_SLUGS];
    for (const slug of sectorSlugs) {
      revalidatePath(`/${slug}`, 'layout');
    }
    if (targetCompanySlug?.trim()) {
      const companySlug = targetCompanySlug.trim().toLowerCase();
      revalidatePathMax(`/companies/${companySlug}`);
      for (const loc of routing.locales) {
        if (loc === routing.defaultLocale) continue;
        revalidatePathMax(`/${loc}/companies/${companySlug}`);
      }
    }
    for (const loc of routing.locales) {
      if (loc === routing.defaultLocale) continue;
      revalidatePath(`/${loc}`, 'layout');
      revalidatePath(`/${loc}/companies`, 'layout');
      for (const slug of sectorSlugs) {
        revalidatePath(`/${loc}/${slug}`, 'layout');
      }
    }
  } catch {
    /* best effort */
  }
}

const createSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(120),
  sectorSlug: z.string().min(1).max(120),
  logoImage: z.string().max(500).optional().nullable(),
  heroImage: z.string().max(500).optional().nullable(),
  websiteUrl: z.string().max(500).optional().nullable(),
  description: z.string().max(4000).optional().nullable(),
  aboutContent: z.string().max(12000).optional().nullable(),
  facebookUrl: z.string().max(500).optional().nullable(),
  instagramUrl: z.string().max(500).optional().nullable(),
  xUrl: z.string().max(500).optional().nullable(),
  youtubeUrl: z.string().max(500).optional().nullable(),
  pinterestUrl: z.string().max(500).optional().nullable(),
});

export async function GET(request: Request) {
  const session = await auth();
  const role = (session as { user?: { role?: string } } | null | undefined)?.user?.role;
  if (!session?.user?.id || !isAdminRole(role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDb();
    const url = new URL(request.url);
    const sectorSlug = url.searchParams.get('sector')?.trim().toLowerCase() || null;

    const companies = await prisma.company.findMany({
      where: sectorSlug ? { sector: { slug: sectorSlug } } : undefined,
      orderBy: [{ createdAt: 'desc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        logoImage: true,
        heroImage: true,
        websiteUrl: true,
        description: true,
        aboutContent: true,
        facebookUrl: true,
        instagramUrl: true,
        xUrl: true,
        youtubeUrl: true,
        pinterestUrl: true,
        createdAt: true,
        updatedAt: true,
        sector: { select: { id: true, name: true, slug: true } },
      },
    });
    return NextResponse.json({ companies });
  } catch (error) {
    await captureErrorToDb({
      error,
      request,
      statusCode: 500,
      context: 'admin/companies/GET',
      user: { id: session.user.id, email: session.user.email ?? null, role: role ?? null },
    });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  const role = (session as { user?: { role?: string } } | null | undefined)?.user?.role;
  if (!session?.user?.id || !isAdminRole(role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const raw = (await request.json().catch(() => null)) as unknown;
    const parsed = createSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid input', errors: parsed.error.issues }, { status: 400 });
    }

    const slug = parsed.data.slug.trim().toLowerCase().replace(/\s+/g, '-');
    const sectorSlug = parsed.data.sectorSlug.trim().toLowerCase();

    await connectDb();
    const sector = await prisma.sector.findUnique({ where: { slug: sectorSlug }, select: { id: true } });
    if (!sector) {
      return NextResponse.json({ message: 'Invalid sector' }, { status: 400 });
    }

    const company = await prisma.company.create({
      data: {
        name: parsed.data.name.trim(),
        slug,
        sectorId: sector.id,
        logoImage: parsed.data.logoImage?.trim() || null,
        heroImage: parsed.data.heroImage?.trim() || null,
        websiteUrl: parsed.data.websiteUrl?.trim() || null,
        description: parsed.data.description?.trim() || null,
        aboutContent: parsed.data.aboutContent?.trim() || null,
        facebookUrl: parsed.data.facebookUrl?.trim() || null,
        instagramUrl: parsed.data.instagramUrl?.trim() || null,
        xUrl: parsed.data.xUrl?.trim() || null,
        youtubeUrl: parsed.data.youtubeUrl?.trim() || null,
        pinterestUrl: parsed.data.pinterestUrl?.trim() || null,
      },
      select: { id: true, name: true, slug: true },
    });
    revalidateCompanyPublicRoutes(sectorSlug, slug);

    return NextResponse.json({ ok: true, company }, { status: 201 });
  } catch (error) {
    await captureErrorToDb({
      error,
      request,
      statusCode: 500,
      context: 'admin/companies/POST',
      user: session?.user?.id ? { id: session.user.id, email: session.user.email ?? null, role: role ?? null } : null,
    });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

