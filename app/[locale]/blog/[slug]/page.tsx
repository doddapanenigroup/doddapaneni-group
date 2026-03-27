import { notFound, permanentRedirect } from 'next/navigation';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { getBlogMessages } from '@/lib/messages';
import { routing } from '@/i18n/routing';
import { connectDb, prisma } from '@/lib/db';
import { mediaUrl } from '@/lib/media';
import { BLOG_POST_META } from '@/lib/blog-post-meta';
import BlogPostClient from './BlogPostClient';
import { publishScheduledContent } from '@/lib/publish-scheduled';

export const dynamic = 'force-dynamic';
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
  const canonical = dbPost.sector?.slug
    ? `/${locale}/${dbPost.sector.slug}/${slug}`
    : `/${locale}/blog/${slug}`;

  return {
    title,
    description,
    keywords: dbPost.keywords ?? undefined,
    alternates: { canonical },
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
  const pathname = (await headers()).get('x-pathname') ?? '';
  const fromPath = pathname.split('/').filter(Boolean)[0];
  // Use route param first so /hi/blog/... and /es/blog/... always get Hindi/Spanish
  const locale =
    routing.locales.includes(paramLocale as (typeof routing.locales)[number]) ? paramLocale
    : fromPath && routing.locales.includes(fromPath as (typeof routing.locales)[number]) ? fromPath
    : routing.defaultLocale;

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
    where: { slug },
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
    permanentRedirect(`/${locale}/${dbPost.sector.slug}/${slug}`);
  }

  if (!dbPost || dbPost.status !== 'published' || (dbPost.scheduledPublishAt && dbPost.scheduledPublishAt > now)) {
    const messagePost = blog.posts[slug];
    if (!messagePost) notFound();

    return (
      <BlogPostClient
        locale={locale}
        blogContent={messagePost.content ?? ''}
        backToBlog={blog.backToBlog}
        title={messagePost.title}
        category="Blog"
        readTime={messagePost.readTime}
        image={BLOG_POST_META[slug]?.image ?? null}
        publishedAt={null}
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
      category="Blog"
      readTime={`${readMinutes} min read`}
      image={normalizeStoredImage(dbPost.featuredImage)}
      publishedAt={dbPost.publishedAt ? dbPost.publishedAt.toISOString() : null}
    />
  );
}
