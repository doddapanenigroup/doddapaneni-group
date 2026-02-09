import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { getBlogContent } from '@/lib/blog-content';
import { getBlogMessages } from '@/lib/messages';
import { routing } from '@/i18n/routing';
import BlogPostClient from './BlogPostClient';

export const dynamic = 'force-dynamic';

const BLOG_POST_META: Record<string, { date: string; image: string }> = {
  'future-of-ecommerce-2026': { date: '2026-02-06', image: '/home.jpg' },
  'healthcare-technology-innovations': { date: '2026-02-06', image: '/about.jpg' },
  'sustainable-construction-practices': { date: '2026-02-06', image: '/home.jpg' },
  'digital-marketing-strategies': { date: '2026-02-06', image: '/about.jpg' },
  'ai-transformation-business': { date: '2026-02-06', image: '/home.jpg' },
  'global-trade-opportunities': { date: '2026-02-06', image: '/about.jpg' },
  'logistics-automation': { date: '2026-02-06', image: '/home.jpg' },
  'workforce-development-skills': { date: '2026-02-06', image: '/about.jpg' },
  'media-digital-transformation': { date: '2026-02-06', image: '/home.jpg' },
  'manufacturing-industry-4-0': { date: '2026-02-06', image: '/about.jpg' },
  'food-processing-innovation': { date: '2026-02-06', image: '/home.jpg' },
  'real-estate-investment-tips': { date: '2026-02-06', image: '/about.jpg' },
  'cloud-computing-benefits': { date: '2026-02-06', image: '/home.jpg' },
  'telemedicine-healthcare': { date: '2026-02-06', image: '/home.jpg' },
  'sustainable-business-practices': { date: '2026-02-06', image: '/home.jpg' },
  'customer-experience-digital-age': { date: '2026-02-06', image: '/about.jpg' },
  'data-security-best-practices': { date: '2026-02-06', image: '/home.jpg' },
  'remote-work-productivity': { date: '2026-02-06', image: '/home.jpg' },
  'supply-chain-resilience': { date: '2026-02-06', image: '/home.jpg' },
  'entrepreneurship-startup-success': { date: '2026-02-06', image: '/about.jpg' },
};

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
