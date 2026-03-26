import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { getBlogMessages } from '@/lib/messages';
import { routing } from '@/i18n/routing';
import { connectDb, prisma } from '@/lib/db';
import { mediaUrl } from '@/lib/media';
import { BLOG_POST_META } from '@/lib/blog-post-meta';
import BlogPostClient from './BlogPostClient';
import { publishScheduledContent } from '@/lib/publish-scheduled';

export const dynamic = 'force-dynamic';

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
    },
  });
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
