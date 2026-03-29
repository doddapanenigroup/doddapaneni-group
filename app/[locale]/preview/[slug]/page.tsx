import { notFound } from "next/navigation";
import { Metadata } from "next";
import { connectDb, prisma } from "@/lib/db";
import { verifyPreviewToken } from "@/lib/preview-token";
import { mediaUrl } from "@/lib/media";
import BlogPostClient from "../../news/[slug]/BlogPostClient";
import { BLOG_POST_META } from "@/lib/blog-post-meta";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type Props = { params: Promise<{ locale: string; slug: string }> };

function normalizeStoredImage(value: string | null): string | null {
  if (!value) return null;
  const s = value.trim();
  if (!s) return null;
  if (s.startsWith("/api/media/")) return s;
  if (s.startsWith("api/media/")) return `/${s}`;
  if (s.startsWith("http://") || s.startsWith("https://")) {
    try {
      const u = new URL(s);
      if (u.pathname.startsWith("/api/media/")) return u.pathname;
    } catch {
      // ignore
    }
    return s;
  }
  return mediaUrl(s.startsWith("/") ? s.slice(1) : s);
}

export default async function PreviewPage({ params }: Props) {
  const { locale, slug: token } = await params;

  const payload = verifyPreviewToken(token);
  if (!payload) notFound();

  await connectDb();

  if (payload.kind === "page") {
    if (!payload.locale || payload.locale !== locale) notFound();

    const doc = await prisma.pageContent.findFirst({
      where: { slug: payload.slug, locale },
      select: { title: true, body: true, pageKey: true },
    });

    if (!doc) notFound();

    return (
      <div className="bg-slate-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <div className="mb-4">
            <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1 text-xs font-semibold">
              Preview (draft)
            </span>
          </div>
          {doc.title ? (
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-4 sm:mb-6">
              {doc.title}
            </h1>
          ) : null}
          {doc.body ? (
            <div
              className="prose prose-slate max-w-none prose-sm sm:prose-base lg:prose-lg"
              dangerouslySetInnerHTML={{ __html: doc.body }}
            />
          ) : null}
        </div>
      </div>
    );
  }

  // blog
  const dbPost = await prisma.blog.findFirst({
    where: { slug: payload.slug },
    select: { title: true, content: true, featuredImage: true, publishedAt: true },
  });

  if (!dbPost) notFound();

  const plain = dbPost.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const readMinutes = Math.max(1, Math.ceil(plain.split(/\s+/).filter(Boolean).length / 220));

  const fallbackMeta = BLOG_POST_META[payload.slug as keyof typeof BLOG_POST_META] ?? null;

  return (
    <BlogPostClient
      locale={locale}
      blogContent={dbPost.content ?? ""}
      backToBlog={"Back to News"}
      title={dbPost.title ?? "News preview"}
      category="News"
      readTime={`${readMinutes} min read`}
      image={normalizeStoredImage(dbPost.featuredImage) ?? (fallbackMeta?.image ?? null)}
      publishedAt={dbPost.publishedAt ? dbPost.publishedAt.toISOString() : null}
      articlePathname={`/news/${payload.slug}`}
      articleSlug={payload.slug}
      showEngagement={false}
    />
  );
}

