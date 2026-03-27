import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { getBlogMessages } from '@/lib/messages';
import { routing } from '@/i18n/routing';
import { connectDb, prisma } from '@/lib/db';
import { mediaUrl } from '@/lib/media';
import BlogPostClient from '@/app/[locale]/blog/[slug]/BlogPostClient';
import { publishScheduledContent } from '@/lib/publish-scheduled';

export const dynamic = 'force-dynamic';
const SITE_NAME = 'Doddapaneni Group';

type Props = { params: Promise<{ locale: string; sector: string; slug: string }> };

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
  const { locale: paramLocale, slug, sector } = await params;
  const locale = routing.locales.includes(paramLocale as (typeof routing.locales)[number])
    ? paramLocale
    : routing.defaultLocale;
  await connectDb();
  const now = new Date();
  await publishScheduledContent(now);
  const row = await prisma.blog.findFirst({
    where: {
      slug: slug.trim(),
      status: 'published',
      OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: now } }],
      sector: { slug: sector.trim().toLowerCase() },
    },
    select: {
      title: true,
      metaTitle: true,
      metaDescription: true,
      keywords: true,
      ogTitle: true,
      ogDescription: true,
      ogImage: true,
      featuredImage: true,
      content: true,
      sector: { select: { slug: true, name: true } },
    },
  });
  if (!row) return {};

  const image = normalizeStoredImage(row.ogImage ?? row.featuredImage);
  const plain = row.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const dynamicDescription = plain.length > 160 ? `${plain.slice(0, 160)}...` : plain;
  const title = `${row.metaTitle ?? row.title} | ${SITE_NAME}`;
  const description = row.metaDescription ?? dynamicDescription;
  const canonical = `/${locale}/${row.sector?.slug ?? sector}/${slug}`;

  return {
    title,
    description,
    keywords: row.keywords ?? undefined,
    alternates: {
      canonical,
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
  const { locale: paramLocale, sector, slug } = await params;
  const pathname = (await headers()).get('x-pathname') ?? '';
  const fromPath = pathname.split('/').filter(Boolean)[0];
  const locale =
    routing.locales.includes(paramLocale as (typeof routing.locales)[number])
      ? paramLocale
      : fromPath && routing.locales.includes(fromPath as (typeof routing.locales)[number])
        ? fromPath
        : routing.defaultLocale;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const blog = getBlogMessages(locale);
  if (!blog) notFound();

  await connectDb();
  const now = new Date();
  await publishScheduledContent(now);

  const dbPost = await prisma.blog.findFirst({
    where: {
      slug: slug.trim(),
      status: 'published',
      OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: now } }],
      sector: { slug: sector.trim().toLowerCase() },
    },
    select: {
      title: true,
      content: true,
      featuredImage: true,
      publishedAt: true,
      sector: { select: { name: true, slug: true } },
    },
  });

  // Validate sector + blog match and return 404 for invalid combinations.
  if (!dbPost) notFound();

  const plain = dbPost.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const readMinutes = Math.max(1, Math.ceil(plain.split(/\s+/).filter(Boolean).length / 220));

  return (
    <BlogPostClient
      locale={locale}
      blogContent={dbPost.content}
      backToBlog={blog.backToBlog}
      title={dbPost.title}
      category={dbPost.sector?.name ?? 'Blog'}
      readTime={`${readMinutes} min read`}
      image={normalizeStoredImage(dbPost.featuredImage)}
      publishedAt={dbPost.publishedAt ? dbPost.publishedAt.toISOString() : null}
    />
  );
}

