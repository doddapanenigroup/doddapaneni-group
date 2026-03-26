import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { routing } from '@/i18n/routing';
import { getBlogMessages } from '@/lib/messages';
import { connectDb, prisma } from '@/lib/db';
import { mediaUrl } from '@/lib/media';
import BlogListClient from './BlogListClient';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

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

export default async function BlogPage({ params }: Props) {
  const { locale: paramLocale } = await params;
  const pathname = (await headers()).get('x-pathname') ?? '';
  const fromPath = pathname.split('/').filter(Boolean)[0];
  // Use route param first so /hi/blog and /es/blog always get Hindi/Spanish
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
  const rows = await prisma.blog.findMany({
    where: { status: 'published' },
    orderBy: [{ publishedAt: 'desc' }, { updatedAt: 'desc' }],
  });
  const posts =
    rows.length > 0
      ? rows.map((r) => {
          const plain = r.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          const first = plain.slice(0, 180);
          const readMinutes = Math.max(1, Math.ceil(plain.split(/\s+/).filter(Boolean).length / 220));
          return {
            slug: r.slug,
            title: r.title,
            excerpt: first.length < plain.length ? `${first}...` : first,
            image: normalizeStoredImage(r.featuredImage),
            publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
            readTime: `${readMinutes} min read`,
            category: 'Blog',
          };
        })
      : Object.entries(blog.posts).map(([slug, p]) => ({
          slug,
          title: p.title,
          excerpt: p.excerpt,
          image: null,
          publishedAt: null,
          readTime: p.readTime,
          category: p.category,
        }));

  return <BlogListClient locale={locale} blog={blog} posts={posts} />;
}
