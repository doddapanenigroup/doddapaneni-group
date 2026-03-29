import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getBlogMessages } from '@/lib/messages';
import { routing } from '@/i18n/routing';
import { fetchPublishedSectorBlogPost } from '@/lib/sector-blog-post';
import { localeFromRouteParam } from '@/lib/locale-from-path';
import { normalizeStoredImage, publicPathWithLocale } from '@/lib/sector-landing';
import { alternateLanguagesForPathname } from '@/lib/sitemap-build';
import { getSiteOrigin } from '@/lib/site-origin';
import BlogPostClient from '@/app/[locale]/news/[slug]/BlogPostClient';

/** ISR: sector posts refresh on an interval without forcing every request dynamic. */
export const revalidate = 120;

const SITE_NAME = 'Doddapaneni Group';

type Props = { params: Promise<{ locale: string; company: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: paramLocale, slug, company } = await params;
  const locale = routing.locales.includes(paramLocale as (typeof routing.locales)[number])
    ? paramLocale
    : routing.defaultLocale;

  const sectorSlug = company.trim().toLowerCase();
  const row = await fetchPublishedSectorBlogPost(sectorSlug, slug);
  if (!row) return {};

  const image = normalizeStoredImage(row.ogImage ?? row.featuredImage);
  const plain = row.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const dynamicDescription = plain.length > 160 ? `${plain.slice(0, 160)}...` : plain;
  const title = `${row.metaTitle ?? row.title} | ${SITE_NAME}`;
  const description = row.metaDescription ?? dynamicDescription;
  const origin = getSiteOrigin();
  const pathRel = publicPathWithLocale(locale, row.sector.slug, slug.trim());
  const canonical = `${origin}${pathRel}`;
  const pathnameForHreflang = `/${row.sector.slug}/${slug.trim()}`;

  return {
    title,
    description,
    keywords: row.keywords ?? undefined,
    alternates: {
      canonical,
      languages: alternateLanguagesForPathname(origin, pathnameForHreflang),
    },
    openGraph: {
      title: row.ogTitle ?? title,
      description: row.ogDescription ?? description,
      images: image ? [image] : undefined,
      url: canonical,
      siteName: SITE_NAME,
      locale,
      type: 'article',
    },
  };
}

export default async function SectorBlogPostPage({ params }: Props) {
  const { locale: paramLocale, company, slug } = await params;
  const locale = localeFromRouteParam(paramLocale);
  const sectorSlug = company.trim().toLowerCase();

  if (!routing.locales.includes(locale)) {
    notFound();
  }

  const blog = getBlogMessages(locale);
  if (!blog) notFound();

  const dbPost = await fetchPublishedSectorBlogPost(sectorSlug, slug);
  if (!dbPost) notFound();

  const plain = dbPost.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const readMinutes = Math.max(1, Math.ceil(plain.split(/\s+/).filter(Boolean).length / 220));
  const sectorArticlePath = `/${dbPost.sector.slug}/${slug.trim()}`;

  return (
    <BlogPostClient
      locale={locale}
      blogContent={dbPost.content}
      backToBlog={blog.backToBlog}
      title={dbPost.title}
      category={dbPost.sector.name}
      readTime={`${readMinutes} min read`}
      image={normalizeStoredImage(dbPost.featuredImage)}
      publishedAt={dbPost.publishedAt ? dbPost.publishedAt.toISOString() : null}
      articlePathname={sectorArticlePath}
      articleSlug={slug.trim()}
    />
  );
}
