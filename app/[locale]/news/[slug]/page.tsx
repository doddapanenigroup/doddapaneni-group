import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getBlogMessages } from '@/lib/messages';
import { routing } from '@/i18n/routing';
import { connectDb, prisma } from '@/lib/db';
import { mediaUrl } from '@/lib/media';
import { BLOG_POST_META } from '@/lib/blog-post-meta';
import BlogPostClient from './BlogPostClient';
import { publishScheduledContent } from '@/lib/publish-scheduled';
import { publicPathWithLocale } from '@/lib/sector-landing';
import { alternateLanguagesForPathname } from '@/lib/sitemap-build';
import { getSiteOrigin } from '@/lib/site-origin';
import { localeFromRouteParam } from '@/lib/locale-from-path';
import {
  canonicalDivisionDisplayName,
  isCompanyDivisionSlug,
} from '@/lib/company-divisions';
import { getPublicSectorBySlug } from '@/lib/data/sector-repository';
import { listPublishedBlogsForSectorPage } from '@/lib/data/sector-blog-repository';
import NewsSectorBlogList from '@/components/news/NewsSectorBlogList';
import type { NewsSectorPostItem } from '@/components/news/NewsSectorBlogList';

export const revalidate = 120;
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
  const trimmed = slug.trim();

  if (isCompanyDivisionSlug(trimmed)) {
    const sector = await getPublicSectorBySlug(trimmed);
    if (!sector) return {};
    const label = canonicalDivisionDisplayName(sector.slug, sector.name);
    const t = await getTranslations({ locale, namespace: 'Blog' });
    const title = `${label} — ${t('title')} | ${SITE_NAME}`;
    const description = t('sectorNewsSubtitle');
    const origin = getSiteOrigin();
    const pathRel = publicPathWithLocale(locale, 'news', trimmed);
    const canonical = `${origin}${pathRel}`;
    const pathnameForHreflang = `/news/${trimmed}`;
    return {
      title,
      description,
      robots: { index: true, follow: true },
      alternates: {
        canonical,
        languages: alternateLanguagesForPathname(origin, pathnameForHreflang),
      },
      openGraph: {
        title,
        description,
        url: canonical,
        siteName: SITE_NAME,
        type: 'website',
      },
    };
  }

  await connectDb();
  const now = new Date();
  await publishScheduledContent(now);
  const dbPost = await prisma.blog.findFirst({
    where: {
      slug: trimmed,
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
      translations: {
        where: { locale },
        select: {
          title: true,
          content: true,
          metaTitle: true,
          metaDescription: true,
          ogTitle: true,
          ogDescription: true,
        },
        take: 1,
      },
    },
  });
  if (!dbPost) return {};

  const tr = dbPost.translations[0];
  const dispTitle = tr?.title ?? dbPost.title;
  const dispContent = tr?.content ?? dbPost.content;
  const dispMetaTitle = tr?.metaTitle ?? dbPost.metaTitle;
  const dispMetaDesc = tr?.metaDescription ?? dbPost.metaDescription;
  const dispOgTitle = tr?.ogTitle ?? dbPost.ogTitle;
  const dispOgDesc = tr?.ogDescription ?? dbPost.ogDescription;

  const plain = dispContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const dynamicDescription = plain.length > 160 ? `${plain.slice(0, 160)}...` : plain;
  const description = dispMetaDesc ?? dynamicDescription;
  const title = `${dispMetaTitle ?? dispTitle} | ${SITE_NAME}`;
  const image = normalizeStoredImage(dbPost.ogImage ?? dbPost.featuredImage);
  const origin = getSiteOrigin();
  const pathRel = dbPost.sector?.slug
    ? publicPathWithLocale(locale, 'news', dbPost.sector.slug, trimmed)
    : publicPathWithLocale(locale, 'news', trimmed);
  const canonical = `${origin}${pathRel}`;
  const pathnameForHreflang = dbPost.sector?.slug
    ? `/news/${dbPost.sector.slug}/${trimmed}`
    : `/news/${trimmed}`;

  return {
    title,
    description,
    keywords: dbPost.keywords ?? undefined,
    alternates: {
      canonical,
      languages: alternateLanguagesForPathname(origin, pathnameForHreflang),
    },
    openGraph: {
      title: dispOgTitle ?? title,
      description: dispOgDesc ?? description,
      images: image ? [image] : undefined,
      url: canonical,
      siteName: SITE_NAME,
      locale,
      type: 'article',
    },
  };
}

export default async function NewsSectorListOrArticlePage({ params }: Props) {
  const { locale: paramLocale, slug } = await params;
  const locale = localeFromRouteParam(paramLocale);
  const trimmed = slug.trim();

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const blog = getBlogMessages(locale);
  if (!blog) notFound();

  const t = await getTranslations({ locale, namespace: 'Blog' });

  if (isCompanyDivisionSlug(trimmed)) {
    const sector = await getPublicSectorBySlug(trimmed);
    if (!sector) notFound();

    const now = new Date();
    await publishScheduledContent(now);
    const { rows } = await listPublishedBlogsForSectorPage({
      sector,
      page: 1,
      pageSize: 500,
      now,
      locale,
    });

    const label = canonicalDivisionDisplayName(sector.slug, sector.name);

    const posts: NewsSectorPostItem[] = rows.map((r) => {
      const raw = (r.metaDescription?.trim() || r.ogDescription?.trim()) ?? '';
      const excerpt = raw.length > 200 ? `${raw.slice(0, 200)}…` : raw || r.title;
      const readMinutes = Math.max(1, Math.ceil(excerpt.split(/\s+/).filter(Boolean).length / 220));
      return {
        slug: r.slug,
        title: r.title,
        excerpt,
        image: normalizeStoredImage(r.featuredImage),
        publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
        readTime: t('minReadMinutes', { minutes: readMinutes }),
      };
    });

    return (
      <div className="min-h-screen bg-white">
        <section className="relative overflow-hidden bg-blue-900 px-4 py-10 sm:px-6 md:py-12 lg:px-8">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
            aria-hidden
          />
          <div className="relative mx-auto max-w-4xl text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl lg:text-[2.25rem] lg:leading-tight">
              {label}
            </h1>
            <div className="mx-auto mt-3 h-1.5 w-20 rounded-full bg-white/90" aria-hidden />
          </div>
        </section>
        <NewsSectorBlogList
          locale={locale}
          sectorSlug={trimmed}
          sectorLabel={label}
          readMoreLabel={t('readMore')}
          posts={posts}
        />
      </div>
    );
  }

  await connectDb();
  const now = new Date();
  await publishScheduledContent(now);
  const dbPost = await prisma.blog.findUnique({
    where: { slug: trimmed },
    select: {
      title: true,
      content: true,
      featuredImage: true,
      publishedAt: true,
      status: true,
      scheduledPublishAt: true,
      sector: { select: { slug: true } },
      translations: {
        where: { locale },
        select: {
          title: true,
          content: true,
        },
        take: 1,
      },
    },
  });
  const isPublishedNow =
    !!dbPost &&
    dbPost.status === 'published' &&
    (!dbPost.scheduledPublishAt || dbPost.scheduledPublishAt <= now);

  if (isPublishedNow && dbPost?.sector?.slug) {
    permanentRedirect(publicPathWithLocale(locale, 'news', dbPost.sector.slug, trimmed));
  }

  const hubArticlePath = `/news/${trimmed}`;

  if (!dbPost || dbPost.status !== 'published' || (dbPost.scheduledPublishAt && dbPost.scheduledPublishAt > now)) {
    const messagePost = blog.posts[trimmed];
    if (!messagePost) notFound();

    return (
      <BlogPostClient
        locale={locale}
        blogContent={messagePost.content ?? ''}
        backToBlog={blog.backToBlog}
        title={messagePost.title}
        category="News"
        readTime={messagePost.readTime}
        image={BLOG_POST_META[trimmed]?.image ?? null}
        publishedAt={null}
        articlePathname={hubArticlePath}
        articleSlug={trimmed}
      />
    );
  }

  const tr = dbPost.translations[0];
  const dispTitle = tr?.title ?? dbPost.title;
  const dispContent = tr?.content ?? dbPost.content;
  const plain = dispContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const readMinutes = Math.max(1, Math.ceil(plain.split(/\s+/).filter(Boolean).length / 220));

  return (
    <BlogPostClient
      locale={locale}
      blogContent={dispContent}
      backToBlog={blog.backToBlog}
      title={dispTitle}
      category="News"
      readTime={t('minReadMinutes', { minutes: readMinutes })}
      image={normalizeStoredImage(dbPost.featuredImage)}
      publishedAt={dbPost.publishedAt ? dbPost.publishedAt.toISOString() : null}
      articlePathname={hubArticlePath}
      articleSlug={trimmed}
    />
  );
}
