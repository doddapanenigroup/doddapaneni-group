import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { localeFromRouteParam } from '@/lib/locale-from-path';
import { getSiteOrigin } from '@/lib/site-origin';
import { publicPathWithLocale } from '@/lib/sector-landing';
import { alternateLanguagesForPathname } from '@/lib/sitemap-build';
import { getBlogMessages } from '@/lib/messages';
import { mediaUrl } from '@/lib/media';
import { BLOG_POST_META } from '@/lib/blog-post-meta';
import BlogListLoadingFallback from '@/components/blog/BlogListLoadingFallback';

const BlogListClient = dynamic(() => import('./BlogListClient'), {
  loading: () => <BlogListLoadingFallback />,
});
import { publishScheduledContent } from '@/lib/publish-scheduled';
import { listAllPublishedBlogsWithSector } from '@/lib/data/sector-blog-repository';

/** ISR for news listing — full HTML for crawlers; avoids `force-dynamic` + `headers()`. */
export const revalidate = 120;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: paramLocale } = await params;
  const locale = routing.locales.includes(paramLocale as (typeof routing.locales)[number])
    ? paramLocale
    : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: 'Blog' });
  const title = `${t('title')} | Doddapaneni Group`;
  const description = t('subtitle');
  const origin = getSiteOrigin();
  const path = publicPathWithLocale(locale, 'news');
  const canonical = `${origin}${path}`;

  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: {
      canonical,
      languages: alternateLanguagesForPathname(origin, '/news'),
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'Doddapaneni Group',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

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
  const locale = localeFromRouteParam(paramLocale);

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const blog = getBlogMessages(locale);
  if (!blog) notFound();

  const now = new Date();
  await publishScheduledContent(now);
  const rows = await listAllPublishedBlogsWithSector(now);
  const posts =
    rows.length > 0
      ? rows.map((r) => {
          const plain = r.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          const first = plain.slice(0, 180);
          const readMinutes = Math.max(1, Math.ceil(plain.split(/\s+/).filter(Boolean).length / 220));
          return {
            slug: r.slug,
            href: r.sector?.slug ? `/${r.sector.slug}/${r.slug}` : `/news/${r.slug}`,
            title: r.title,
            excerpt: first.length < plain.length ? `${first}...` : first,
            image: normalizeStoredImage(r.featuredImage),
            publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
            readTime: `${readMinutes} min read`,
            category: r.sector?.name ?? 'News',
          };
        })
      : Object.entries(blog.posts).map(([slug, p]) => ({
          slug,
          href: `/news/${slug}`,
          title: p.title,
          excerpt: p.excerpt,
          image: BLOG_POST_META[slug]?.image ?? null,
          publishedAt: null,
          readTime: p.readTime,
          category: p.category,
        }));

  return <BlogListClient locale={locale} blog={blog} posts={posts} />;
}
