import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDb, prisma } from "@/lib/db";
import { createPreviewToken, PreviewTokenKind } from "@/lib/preview-token";
import { hasMarketerAccess } from "@/lib/role-utils";
import { isFeatureEnabled } from "@/lib/features";
import { publicPathForLocale } from "@/lib/public-path-with-locale";

function allowMarketer(session: { user?: { role?: string } } | null) {
  return hasMarketerAccess(session?.user?.role as any);
}

function strOrNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !allowMarketer(session)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (!(await isFeatureEnabled("previewSharing"))) {
      return NextResponse.json(
        { message: "Preview sharing is disabled in Feature flags." },
        { status: 403 },
      );
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
    }

    const kind = strOrNull(body.kind) as PreviewTokenKind | null;
    const slug = strOrNull(body.slug);
    const locale = strOrNull(body.locale) ?? undefined;
    const expiresInMinutes =
      typeof body.expiresInMinutes === "number" && body.expiresInMinutes > 0
        ? Math.min(24 * 60, Math.floor(body.expiresInMinutes))
        : 60;

    if (!kind || (kind !== "page" && kind !== "blog") || !slug) {
      return NextResponse.json({ message: "kind and slug are required" }, { status: 400 });
    }

    await connectDb();
    const now = new Date();

    if (kind === "page") {
      if (!locale) {
        return NextResponse.json({ message: "locale is required for page previews" }, { status: 400 });
      }

      const doc = await prisma.pageContent.findFirst({
        where: {
          slug,
          locale,
          OR: [{ status: "draft" }, { status: "published", scheduledPublishAt: { gt: now } }],
        },
        select: { pageKey: true },
      });

      if (!doc) return NextResponse.json({ message: "Draft page not found" }, { status: 404 });

      const token = createPreviewToken({
        v: 1,
        kind: "page",
        locale,
        slug,
        pageKey: doc.pageKey,
        exp: Date.now() + expiresInMinutes * 60_000,
      });

      const origin = new URL(request.url).origin;
      return NextResponse.json({
        url: `${origin}${publicPathForLocale(locale, `/preview/${token}`)}`,
        token,
      });
    }

    // blog
    const doc = await prisma.news.findFirst({
      where: {
        slug,
        OR: [
          { status: "draft" },
          { status: "scheduled" },
          { status: "archived" },
          { status: "published", scheduledPublishAt: { gt: now } },
        ],
      },
      select: { slug: true },
    });

    if (!doc) return NextResponse.json({ message: "Draft blog not found" }, { status: 404 });

    const token = createPreviewToken({
      v: 1,
      kind: "blog",
      slug,
      exp: Date.now() + expiresInMinutes * 60_000,
    });

    const origin = new URL(request.url).origin;
    // Locale-aware preview route uses current locale for rendering.
    // If caller didn't provide locale, default to 'en'.
    const previewLocale = locale ?? "en";
    return NextResponse.json({
      url: `${origin}${publicPathForLocale(previewLocale, `/preview/${token}`)}`,
      token,
    });
  } catch (error) {
    console.error("preview token error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

