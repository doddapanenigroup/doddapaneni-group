import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Calendar, ArrowRight } from 'lucide-react';
import {
  estimateReadMinutesForCard,
  excerptForSectorBlogCard,
  fetchSectorLandingData,
  normalizeStoredImage,
  publicPathWithLocale,
} from '@/lib/sector-landing';
import { getDivisionTopicNavItems, topicAnchorIdFromHref } from '@/lib/company-division-nav';
import { isCompanyDivisionSlug } from '@/lib/company-divisions';
import SectorUnavailable from '@/components/sector/SectorUnavailable';

type Props = {
  locale: string;
  sectorSlug: string;
  page: number;
};

export default async function SectorLandingView({ locale, sectorSlug, page }: Props) {
  const data = await fetchSectorLandingData(sectorSlug, page);
  if (!data) {
    if (isCompanyDivisionSlug(sectorSlug)) {
      return <SectorUnavailable locale={locale} slug={sectorSlug} />;
    }
    notFound();
  }

  const { sector, rows, total, totalPages } = data;
  if (total > 0 && rows.length === 0) notFound();

  const basePath = publicPathWithLocale(locale, sector.slug);
  const allBlogsHref = publicPathWithLocale(locale, 'blog');
  const topicAnchors = getDivisionTopicNavItems(sectorSlug).filter((i) => topicAnchorIdFromHref(i.href));

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-blue-900 px-4 py-12 md:py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
            {sector.name} Blogs
          </h1>
          <p className="mx-auto max-w-3xl text-lg text-blue-200 md:text-xl">
            {sector.description ?? `Latest articles and updates in ${sector.name}.`}
          </p>
        </div>
      </section>

      {topicAnchors.length > 0 ? (
        <section
          aria-label="Division focus areas"
          className="border-b border-slate-200 bg-white px-4 py-10 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-slate-500 sm:text-left">
              Focus areas
            </h2>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
              {topicAnchors.map((item) => {
                const id = topicAnchorIdFromHref(item.href);
                if (!id) return null;
                return (
                  <div
                    key={id}
                    id={id}
                    className="scroll-mt-[7.5rem] rounded-2xl border border-slate-200 bg-slate-50/90 p-5 shadow-sm sm:scroll-mt-40"
                  >
                    <h3 className="text-base font-bold text-slate-900">{item.label}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {item.description ??
                        `Learn how we support ${item.label.toLowerCase()} within ${sector.name}.`}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-slate-50 px-4 py-12 md:py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-2 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Sector blogs</h2>
              <p className="mt-1 text-sm text-slate-600">
                Posts tagged with this sector. Open any article at{' '}
                <span className="font-mono text-slate-800">
                  /{sector.slug}/{'{slug}'}
                </span>
                .
              </p>
            </div>
            {rows.length > 0 ? (
              <p className="text-sm text-slate-500">
                {total} {total === 1 ? 'article' : 'articles'}
              </p>
            ) : null}
          </div>

          {rows.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
              <p className="text-base font-medium text-slate-800">No published blogs in this sector yet</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                When posts are published under <span className="font-semibold">{sector.name}</span>, they will
                appear here with links to each article.
              </p>
              <Link
                href={allBlogsHref}
                className="mt-6 inline-flex items-center rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
              >
                Browse all blogs
                <ArrowRight size={16} className="ml-2" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {rows.map((post, postIndex) => {
                const excerpt = excerptForSectorBlogCard(post);
                const readMinutes = estimateReadMinutesForCard(post);
                const imageSrc = normalizeStoredImage(post.featuredImage);
                const postHref = publicPathWithLocale(locale, sector.slug, post.slug);
                return (
                  <article
                    key={post.slug}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-xl"
                  >
                    <Link href={postHref} prefetch>
                      <div className="relative h-48 w-full">
                        {imageSrc ? (
                          <Image
                            src={imageSrc}
                            alt={post.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover"
                            loading={postIndex < 2 ? 'eager' : 'lazy'}
                            fetchPriority={postIndex === 0 ? 'high' : undefined}
                          />
                        ) : (
                          <div className="h-full w-full bg-slate-200" />
                        )}
                      </div>
                      <div className="p-6">
                        <div className="mb-3 flex items-center gap-3">
                          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                            {sector.name}
                          </span>
                          {post.publishedAt ? (
                            <div className="flex items-center text-xs text-slate-500">
                              <Calendar size={14} className="mr-1" />
                              {new Date(post.publishedAt).toLocaleDateString(locale, {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </div>
                          ) : null}
                        </div>
                        <h3 className="mb-3 line-clamp-2 text-xl font-bold text-slate-900 transition-colors hover:text-blue-600">
                          {post.title}
                        </h3>
                        <p className="mb-4 line-clamp-3 text-sm text-slate-600">{excerpt}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">{readMinutes} min read</span>
                          <span className="flex items-center text-sm font-semibold text-blue-600">
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
                prefetch={false}
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
                prefetch={false}
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
