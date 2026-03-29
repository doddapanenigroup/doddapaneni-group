import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getBlogMessages } from '@/lib/messages';
import { routing } from '@/i18n/routing';
import { fetchPublishedSectorBlogPost } from '@/lib/sector-blog-post';
import { localeFromRouteParam } from '@/lib/locale-from-path';
import { normalizeStoredImage, publicPathWithLocale } from '@/lib/sector-landing';
import { alternateLanguagesForPathname } from '@/lib/sitemap-build';
import { getSiteOrigin } from '@/lib/site-origin';
import { isCompanyDivisionSlug } from '@/lib/company-divisions';
import { newsArticlePath, newsSectorListPath } from '@/lib/news-paths';
import BlogPostClient from '../BlogPostClient';

export const revalidate = 120;

const SITE_NAME = 'Doddapaneni Group';

type Props = { params: Promise<{ locale: string; slug: string; articleSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: paramLocale, slug: sectorParam, articleSlug } = await params;
  const locale = routing.locales.includes(paramLocale as (typeof routing.locales)[number])
    ? paramLocale
    : routing.defaultLocale;

  const sectorSlug = sectorParam.trim().toLowerCase();
  if (!isCompanyDivisionSlug(sectorSlug)) return {};

  const row = await fetchPublishedSectorBlogPost(sectorSlug, articleSlug);
  if (!row) return {};

  const image = normalizeStoredImage(row.ogImage ?? row.featuredImage);
  const plain = row.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const dynamicDescription = plain.length > 160 ? `${plain.slice(0, 160)}...` : plain;
  const description = row.metaDescription ?? dynamicDescription;
  const title = `${row.metaTitle ?? row.title} | ${SITE_NAME}`;
  const origin = getSiteOrigin();
  const pathRel = publicPathWithLocale(locale, 'news', sectorSlug, articleSlug.trim());
  const canonical = `${origin}${pathRel}`;
  const pathnameForHreflang = newsArticlePath(sectorSlug, articleSlug.trim());
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

export default async function NewsSectorArticlePage({ params }: Props) {
  const { locale: paramLocale, slug: sectorParam, articleSlug } = await params;
  const locale = localeFromRouteParam(paramLocale);
  const sectorSlug = sectorParam.trim().toLowerCase();

  if (!routing.locales.includes(locale)) {
    notFound();
  }
  if (!isCompanyDivisionSlug(sectorSlug)) {
    notFound();
  }

  const blog = getBlogMessages(locale);
  if (!blog) notFound();

  const t = await getTranslations({ locale, namespace: 'Blog' });

  const dbPost = await fetchPublishedSectorBlogPost(sectorSlug, articleSlug);
  if (!dbPost) notFound();

  const plain = dbPost.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const readMinutes = Math.max(1, Math.ceil(plain.split(/\s+/).filter(Boolean).length / 220));
  const articlePath = newsArticlePath(sectorSlug, articleSlug.trim());
  const sectorListPath = newsSectorListPath(sectorSlug);

  return (
    <BlogPostClient
      locale={locale}
      blogContent={dbPost.content}
      backToBlog={t('backToSectorNews')}
      title={dbPost.title}
      category={dbPost.sector.name}
      readTime={`${readMinutes} min read`}
      image={normalizeStoredImage(dbPost.featuredImage)}
      publishedAt={dbPost.publishedAt ? dbPost.publishedAt.toISOString() : null}
      articlePathname={articlePath}
      articleSlug={articleSlug.trim()}
      backHref={sectorListPath}
    />
  );
}
