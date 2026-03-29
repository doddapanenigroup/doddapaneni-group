import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getBlogMessages } from '@/lib/messages';
import { routing } from '@/i18n/routing';
import { localeFromRouteParam } from '@/lib/locale-from-path';
import { connectDb, prisma } from '@/lib/db';
import { mediaUrl } from '@/lib/media';
import { BLOG_POST_META } from '@/lib/blog-post-meta';
import BlogPostClient from './BlogPostClient';
import { publishScheduledContent } from '@/lib/publish-scheduled';
import { publicPathWithLocale } from '@/lib/sector-landing';
import { alternateLanguagesForPathname } from '@/lib/sitemap-build';
import { getSiteOrigin } from '@/lib/site-origin';

export const revalidate = 120;
const SITE_NAME = 'Doddapaneni Group';

type Props = { params: Promise<{ locale: string; slug: string }> };

function normalizeStoredImage(value: string | null): string | null {
  if (!value) return null;
  const s = value.trim();
  if (!s) return null;
  if (s.startsWith('/api/media/')) return s;
  if (s.startsWith('api/media/')) return `/${s}`;
  if (s.startsWith('http://') || s.startsWith('https://')) {
    try {
      const u = new URL(s);
      if (u.pathname.startsWith('/api/media/')) return u.pathname;
    } catch {
      // ignore
    }
    return s;
  }
  return mediaUrl(s.startsWith('/') ? s.slice(1) : s);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: paramLocale, slug } = await params;
  const locale = routing.locales.includes(paramLocale as (typeof routing.locales)[number])
    ? paramLocale
    : routing.defaultLocale;

  await connectDb();
  const now = new Date();
  await publishScheduledContent(now);
  const dbPost = await prisma.blog.findFirst({
    where: {
      slug: slug.trim(),
      status: 'published',
      OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: now } }],
    },
    select: {
      title: true,
      content: true,
      featuredImage: true,
      metaTitle: true,
      metaDescription: true,
      keywords: true,
      ogTitle: true,
      ogDescription: true,
      ogImage: true,
      sector: { select: { slug: true, name: true } },
    },
  });
  if (!dbPost) return {};

  const plain = dbPost.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const dynamicDescription = plain.length > 160 ? `${plain.slice(0, 160)}...` : plain;
  const description = dbPost.metaDescription ?? dynamicDescription;
  const title = `${dbPost.metaTitle ?? dbPost.title} | ${SITE_NAME}`;
  const image = normalizeStoredImage(dbPost.ogImage ?? dbPost.featuredImage);
  const origin = getSiteOrigin();
  const pathRel = dbPost.sector?.slug
    ? publicPathWithLocale(locale, dbPost.sector.slug, slug.trim())
    : publicPathWithLocale(locale, 'news', slug.trim());
  const canonical = `${origin}${pathRel}`;
  const pathnameForHreflang = dbPost.sector?.slug
    ? `/${dbPost.sector.slug}/${slug.trim()}`
    : `/news/${slug.trim()}`;

  return {
    title,
    description,
    keywords: dbPost.keywords ?? undefined,
    alternates: {
      canonical,
      languages: alternateLanguagesForPathname(origin, pathnameForHreflang),
    },
    openGraph: {
      title: dbPost.ogTitle ?? title,
      description: dbPost.ogDescription ?? description,
      images: image ? [image] : undefined,
      url: canonical,
      siteName: SITE_NAME,
      locale,
      type: 'article',
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { locale: paramLocale, slug } = await params;
  const locale = localeFromRouteParam(paramLocale);

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const blog = getBlogMessages(locale);
  if (!blog) notFound();

  await connectDb();
  const now = new Date();
  // Server-side fallback: if cron hasn't run yet, still publish due items.
  await publishScheduledContent(now);
  const dbPost = await prisma.blog.findUnique({
    where: { slug: slug.trim() },
    select: {
      title: true,
      content: true,
      featuredImage: true,
      publishedAt: true,
      status: true,
      scheduledPublishAt: true,
      sector: { select: { slug: true } },
    },
  });
  const isPublishedNow =
    !!dbPost &&
    dbPost.status === 'published' &&
    (!dbPost.scheduledPublishAt || dbPost.scheduledPublishAt <= now);

  // Prefer canonical sector route for sector-tagged published blogs.
  if (isPublishedNow && dbPost?.sector?.slug) {
    permanentRedirect(publicPathWithLocale(locale, dbPost.sector.slug, slug.trim()));
  }

  const hubArticlePath = `/news/${slug.trim()}`;

  if (!dbPost || dbPost.status !== 'published' || (dbPost.scheduledPublishAt && dbPost.scheduledPublishAt > now)) {
    const messagePost = blog.posts[slug];
    if (!messagePost) notFound();

    return (
      <BlogPostClient
        locale={locale}
        blogContent={messagePost.content ?? ''}
        backToBlog={blog.backToBlog}
        title={messagePost.title}
        category="News"
        readTime={messagePost.readTime}
        image={BLOG_POST_META[slug]?.image ?? null}
        publishedAt={null}
        articlePathname={hubArticlePath}
        articleSlug={slug.trim()}
      />
    );
  }

  const plain = dbPost.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const readMinutes = Math.max(1, Math.ceil(plain.split(/\s+/).filter(Boolean).length / 220));

  return (
    <BlogPostClient
      locale={locale}
      blogContent={dbPost.content}
      backToBlog={blog.backToBlog}
      title={dbPost.title}
      category="News"
      readTime={`${readMinutes} min read`}
      image={normalizeStoredImage(dbPost.featuredImage)}
      publishedAt={dbPost.publishedAt ? dbPost.publishedAt.toISOString() : null}
      articlePathname={hubArticlePath}
      articleSlug={slug.trim()}
    />
  );
}
