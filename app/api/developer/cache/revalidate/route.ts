import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@/auth';
import type { Role } from '@/lib/constants';

function allowedRole(role: Role | undefined): boolean {
  return role === 'DEVELOPER' || role === 'ADMIN' || role === 'SUPER_ADMIN';
}

function strArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v) => typeof v === 'string')
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, 50);
}

/**
 * Developer-only cache revalidation endpoint.
 *
 * Supports:
 * - `paths`: array of route paths (e.g. "/en", "/en/blog", "/en/about")
 * - `tags`: array of cache tags (only affects fetch() requests that used those tags)
 *
 * Note: This does not purge external/CDN caches. It triggers Next.js on-demand revalidation.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    const role = session?.user?.role as Role | undefined;
    if (!session?.user || !allowedRole(role)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const paths = strArray((body as { paths?: unknown }).paths);
    const tags = strArray((body as { tags?: unknown }).tags);

    // Safe defaults: revalidate common public pages.
    const effectivePaths = paths.length
      ? paths
      : [
          '/',
          '/en',
          '/en/about',
          '/en/services',
          '/en/contact',
          '/en/blog',
        ];

    const results: { paths: { path: string; ok: boolean }[]; tags: { tag: string; ok: boolean }[] } = {
      paths: [],
      tags: [],
    };

    for (const p of effectivePaths) {
      try {
        revalidatePath(p);
        results.paths.push({ path: p, ok: true });
      } catch {
        results.paths.push({ path: p, ok: false });
      }
    }

    for (const t of tags) {
      try {
        // Next.js 16 expects a second argument for revalidateTag.
        // Use "page" as a safe default scope.
        revalidateTag(t, 'page');
        results.tags.push({ tag: t, ok: true });
      } catch {
        results.tags.push({ tag: t, ok: false });
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (error) {
    console.error('Developer cache revalidate error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

