import { createTranslator } from '@/lib/translation-format';
import { getDictionary } from '@/lib/translations';
import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getBlogMessages } from '@/lib/messages';
import { routing } from '@/i18n/routing';
import { fetchPublishedSectorBlogPost, resolvePublishedArticleRoute } from '@/lib/sector-blog-post';
import { localeFromRouteParam } from '@/lib/locale-from-path';
import { normalizeStoredImage, publicPathWithLocale } from '@/lib/sector-landing';
import { alternateLanguagesForPathname } from '@/lib/sitemap-build';
import { getSiteOrigin } from '@/lib/site-origin';
import { isCompanyDivisionSlug } from '@/lib/company-divisions';
import { newsArticlePath, newsSectorListPath } from '@/lib/news-paths';
import { getSectorLiveMapFromDb } from '@/lib/data/sector-repository';
import BlogPostClient from '../BlogPostClient';

/** Avoid serving a long-lived cached 404 when a post is published or its sector is corrected. */
export const revalidate = 0;

const SITE_NAME = 'Doddapaneni Group';

type Props = { params: Promise<{ locale: string; slug: string; articleSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: paramLocale, slug: sectorParam, articleSlug } = await params;
  const locale = routing.locales.includes(paramLocale as (typeof routing.locales)[number])
    ? paramLocale
    : routing.defaultLocale;

  const sectorSlug = sectorParam.trim().toLowerCase();
  if (!isCompanyDivisionSlug(sectorSlug)) return {};

  const trimmedArticle = articleSlug.trim();
  let row = await fetchPublishedSectorBlogPost(sectorSlug, trimmedArticle, locale);
  if (!row) {
    const hint = await resolvePublishedArticleRoute(trimmedArticle);
    if (hint.status === 'ok' && hint.sectorSlug !== sectorSlug) {
      row = await fetchPublishedSectorBlogPost(hint.sectorSlug, hint.canonicalNewsSlug, locale);
    }
  }
  if (!row) return {};

  const articleSeg = row.slug;
  const image = normalizeStoredImage(row.ogImage ?? row.featuredImage);
  const plain = row.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const dynamicDescription = plain.length > 160 ? `${plain.slice(0, 160)}...` : plain;
  const description = row.metaDescription ?? dynamicDescription;
  const title = `${row.metaTitle ?? row.title} | ${SITE_NAME}`;
  const origin = getSiteOrigin();
  const pathRel = publicPathWithLocale(locale, 'news', row.sector.slug, articleSeg);
  const canonical = `${origin}${pathRel}`;
  const pathnameForHreflang = newsArticlePath(row.sector.slug, articleSeg);
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

  const t = createTranslator(getDictionary(locale), 'Blog');

  const trimmedArticle = articleSlug.trim();
  let dbPost = await fetchPublishedSectorBlogPost(sectorSlug, trimmedArticle, locale);
  if (!dbPost) {
    const hint = await resolvePublishedArticleRoute(trimmedArticle);
    if (hint.status === 'missing') notFound();
    if (hint.status === 'no_sector') {
      permanentRedirect(publicPathWithLocale(locale, 'news', hint.canonicalNewsSlug));
    }
    if (hint.sectorSlug !== sectorSlug) {
      permanentRedirect(
        publicPathWithLocale(locale, 'news', hint.sectorSlug, hint.canonicalNewsSlug),
      );
    }
    dbPost = await fetchPublishedSectorBlogPost(sectorSlug, hint.canonicalNewsSlug, locale);
    if (!dbPost) notFound();
  }

  if (dbPost.slug !== trimmedArticle) {
    permanentRedirect(publicPathWithLocale(locale, 'news', dbPost.sector.slug, dbPost.slug));
  }

  const plain = dbPost.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const readMinutes = Math.max(1, Math.ceil(plain.split(/\s+/).filter(Boolean).length / 220));
  const articleSectorSlug = dbPost.sector.slug;
  const articlePath = newsArticlePath(articleSectorSlug, dbPost.slug);
  const sectorListPath = newsSectorListPath(articleSectorSlug);
  const initialSectorLiveMap = await getSectorLiveMapFromDb();

  return (
    <BlogPostClient
      locale={locale}
      blogContent={dbPost.content}
      backToBlog={t('backToSectorNews')}
      title={dbPost.title}
      category={dbPost.sector.name}
      readTime={t('minReadMinutes', { minutes: readMinutes })}
      image={normalizeStoredImage(dbPost.featuredImage)}
      publishedAt={dbPost.publishedAt ? dbPost.publishedAt.toISOString() : null}
      articlePathname={articlePath}
      articleSlug={dbPost.slug}
      backHref={sectorListPath}
      sectorNavSlug={articleSectorSlug}
      initialSectorLiveMap={initialSectorLiveMap}
    />
  );
}
