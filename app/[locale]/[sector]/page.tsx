import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { Calendar, ArrowRight } from 'lucide-react';
import { connectDb, prisma } from '@/lib/db';
import { mediaUrl } from '@/lib/media';
import { routing } from '@/i18n/routing';
import { publishScheduledContent } from '@/lib/publish-scheduled';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 12;
const SITE_NAME = 'Doddapaneni Group';

type Props = {
  params: Promise<{ locale: string; sector: string }>;
  searchParams: Promise<{ page?: string }>;
};

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

function toPositivePage(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? '1', 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: paramLocale, sector } = await params;
  const locale = routing.locales.includes(paramLocale as (typeof routing.locales)[number])
    ? paramLocale
    : routing.defaultLocale;
  await connectDb();
  const row = await prisma.sector.findUnique({
    where: { slug: sector.trim().toLowerCase() },
    select: { name: true, description: true, slug: true },
  });
  if (!row) return {};
  const title = `${row.name} Blogs | ${SITE_NAME}`;
  const description = row.description ?? `Read the latest ${row.name} insights and updates.`;
  const canonical = `/${locale}/${row.slug}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: 'website',
    },
  };
}

export default async function SectorListingPage({ params, searchParams }: Props) {
  const { locale: paramLocale, sector: sectorParam } = await params;
  const { page: pageRaw } = await searchParams;

  const pathname = (await headers()).get('x-pathname') ?? '';
  const fromPath = pathname.split('/').filter(Boolean)[0];
  const locale =
    routing.locales.includes(paramLocale as (typeof routing.locales)[number])
      ? paramLocale
      : fromPath && routing.locales.includes(fromPath as (typeof routing.locales)[number])
        ? fromPath
        : routing.defaultLocale;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();

  const page = toPositivePage(pageRaw);
  const sectorSlug = sectorParam.trim().toLowerCase();

  await connectDb();
  const sector = await prisma.sector.findUnique({
    where: { slug: sectorSlug },
    select: { id: true, name: true, slug: true, description: true },
  });
  if (!sector) notFound();

  const now = new Date();
  await publishScheduledContent(now);

  const where = {
    status: 'published' as const,
    sectorId: sector.id,
    OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: now } }],
  };

  const [total, rows] = await Promise.all([
    prisma.blog.count({ where }),
    prisma.blog.findMany({
      where,
      orderBy: [{ publishedAt: 'desc' }, { updatedAt: 'desc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        slug: true,
        title: true,
        content: true,
        featuredImage: true,
        publishedAt: true,
      },
    }),
  ]);

  if (total > 0 && rows.length === 0) notFound();

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const basePath = `/${locale}/${sector.slug}`;

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-blue-900 py-12 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            {sector.name} Blogs
          </h1>
          <p className="text-blue-200 text-lg md:text-xl max-w-3xl mx-auto">
            {sector.description ?? `Latest articles and updates in ${sector.name}.`}
          </p>
        </div>
      </section>

      <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          {rows.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
              No published blogs in this sector yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {rows.map((post) => {
                const plain = post.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                const excerpt = plain.length > 180 ? `${plain.slice(0, 180)}...` : plain;
                const readMinutes = Math.max(1, Math.ceil(plain.split(/\s+/).filter(Boolean).length / 220));
                const imageSrc = normalizeStoredImage(post.featuredImage);
                return (
                  <article
                    key={post.slug}
                    className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 border border-slate-200"
                  >
                    <Link href={`${basePath}/${post.slug}`}>
                      <div className="relative h-48 w-full">
                        {imageSrc ? (
                          <Image
                            src={imageSrc}
                            alt={post.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-slate-200" />
                        )}
                      </div>
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                            {sector.name}
                          </span>
                          {post.publishedAt ? (
                            <div className="flex items-center text-slate-500 text-xs">
                              <Calendar size={14} className="mr-1" />
                              {new Date(post.publishedAt).toLocaleDateString(locale, {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </div>
                          ) : null}
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 hover:text-blue-600 transition-colors">
                          {post.title}
                        </h2>
                        <p className="text-slate-600 text-sm mb-4 line-clamp-3">{excerpt}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">{readMinutes} min read</span>
                          <span className="flex items-center text-blue-600 font-semibold text-sm">
                            Read more
                            <ArrowRight size={16} className="ml-2" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>
          )}

          {totalPages > 1 ? (
            <div className="mt-10 flex items-center justify-center gap-3">
              <Link
                href={page > 2 ? `${basePath}?page=${page - 1}` : basePath}
                className={`rounded-lg border px-4 py-2 text-sm ${
                  page <= 1
                    ? 'pointer-events-none border-slate-200 text-slate-400'
                    : 'border-slate-300 text-slate-700 hover:bg-white'
                }`}
              >
                Previous
              </Link>
              <span className="text-sm text-slate-600">
                Page {page} of {totalPages}
              </span>
              <Link
                href={`${basePath}?page=${page + 1}`}
                className={`rounded-lg border px-4 py-2 text-sm ${
                  page >= totalPages
                    ? 'pointer-events-none border-slate-200 text-slate-400'
                    : 'border-slate-300 text-slate-700 hover:bg-white'
                }`}
              >
                Next
              </Link>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

