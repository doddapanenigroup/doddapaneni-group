import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { getBlogMessages } from '@/lib/messages';
import { routing } from '@/i18n/routing';
import { connectDb, prisma } from '@/lib/db';
import BlogPostClient from './BlogPostClient';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string; slug: string }> };

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
  const dbPost = await prisma.blog.findUnique({
    where: { slug },
    select: {
      title: true,
      content: true,
      featuredImage: true,
      publishedAt: true,
      status: true,
    },
  });
  if (!dbPost || dbPost.status !== 'published') notFound();

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
      image={dbPost.featuredImage}
      publishedAt={dbPost.publishedAt ? dbPost.publishedAt.toISOString() : null}
    />
  );
}
