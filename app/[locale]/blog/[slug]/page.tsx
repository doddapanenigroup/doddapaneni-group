import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { getBlogContent } from '@/lib/blog-content';
import { getBlogMessages } from '@/lib/messages';
import { routing } from '@/i18n/routing';
import { BLOG_POST_META } from '@/lib/blog-post-meta';
import BlogPostClient from './BlogPostClient';

export const dynamic = 'force-dynamic';

const VALID_SLUGS = new Set(Object.keys(BLOG_POST_META));

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

  if (!routing.locales.includes(locale as (typeof routing.locales)[number]) || !VALID_SLUGS.has(slug)) {
    notFound();
  }

  const blog = getBlogMessages(locale);
  const blogContent = getBlogContent(locale, slug);

  if (!blog) notFound();

  const post = blog.posts[slug];
  const title = post?.title ?? slug;
  const category = post?.category ?? '';
  const readTime = post?.readTime ?? '';

  return (
    <BlogPostClient
      slug={slug}
      locale={locale}
      blogContent={blogContent}
      backToBlog={blog.backToBlog}
      title={title}
      category={category}
      readTime={readTime}
    />
  );
}
