import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Calendar, ArrowRight } from 'lucide-react';
import {
  estimateReadMinutesForCard,
  excerptForSectorBlogCard,
  fetchSectorLandingData,
  normalizeStoredImage,
} from '@/lib/sector-landing';
import { getTranslatedDivisionTopicNavItems } from '@/lib/company-division-nav-i18n';
import { topicAnchorIdFromHref } from '@/lib/company-division-nav';
import {
  isCompanyDivisionSlug,
  isSectorLandingContentOnlySlug,
} from '@/lib/company-divisions';
import SectorUnavailable from '@/components/sector/SectorUnavailable';
import SectorFeaturedBrandsGrid from '@/components/sector/SectorFeaturedBrandsGrid';
import { newsArticlePath } from '@/lib/news-paths';
import { listCompaniesBySectorSlug } from '@/lib/data/company-repository';
import { isFlagshipCompanySlug } from '@/lib/sector-featured-companies';

type Props = {
  locale: string;
  sectorSlug: string;
  page: number;
};

export default async function SectorLandingView({ locale, sectorSlug, page }: Props) {
  const normalizedSectorSlug = sectorSlug.trim().toLowerCase();
  const data = await fetchSectorLandingData(normalizedSectorSlug, page, locale);
  if (!data) {
    if (isCompanyDivisionSlug(normalizedSectorSlug)) {
      return <SectorUnavailable locale={locale} slug={normalizedSectorSlug} />;
    }
    notFound();
  }

  const { sector, rows, total, totalPages } = data;
  if (total > 0 && rows.length === 0) notFound();

  const sectorKey = sector.slug.trim().toLowerCase();
  const tBlog = await getTranslations({ locale, namespace: 'Blog' });
  const isActiveSector = sector.isLive;
  const newsLabel = tBlog('title');
  const allNewsHref = '/news';
  const topicAnchors = (await getTranslatedDivisionTopicNavItems(sectorKey, locale)).filter((i) =>
    topicAnchorIdFromHref(i.href),
  );
  const contentOnly = isSectorLandingContentOnlySlug(sectorKey);
  const companies = await listCompaniesBySectorSlug(sector.slug);
  const extraCompanies = companies.filter((c) => !isFlagshipCompanySlug(c.slug));
  const tHome = await getTranslations({ locale, namespace: 'Home' });

  const paginationHref = (p: number) =>
    p <= 1 ? `/${sector.slug}` : `/${sector.slug}?page=${p}`;

  const heroDescription =
    sector.description?.trim() ||
    tBlog('sectorHeroDescriptionFallback', { name: sector.name });

  if (isActiveSector) {
    return (
      <div className="min-h-screen bg-white">
        <section className="bg-blue-900 px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl text-center">
            <h1 className="text-3xl font-bold text-white md:text-4xl lg:text-5xl">{sector.name}</h1>
            <p className="mx-auto mt-4 max-w-3xl text-lg text-blue-200 md:text-xl">{heroDescription}</p>
          </div>
        </section>

        <SectorFeaturedBrandsGrid locale={locale} sectorSlug={sectorKey} />

        {extraCompanies.length > 0 ? (
          <section aria-labelledby="sector-db-companies-heading" className="px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <h2
                id="sector-db-companies-heading"
                className="mb-2 font-serif text-2xl font-bold text-slate-900 sm:text-3xl"
              >
                {tHome('sectorCompaniesListHeading')}
              </h2>
              <p className="mb-8 text-sm text-slate-600 sm:text-base">{tHome('sectorCompaniesListLead')}</p>
              <ul className="space-y-4">
                {extraCompanies.map((c) => {
                  const href = `/companies/${c.slug}`;
                  const logoSrc = normalizeStoredImage(c.logoImage);
                  return (
                    <li key={c.id}>
                      <Link
                        href={href}
                        locale={locale}
                        className="flex items-center gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                      >
                        <div className="relative h-14 w-32 shrink-0 sm:h-16 sm:w-36">
                          {logoSrc ? (
                            <Image
                              src={logoSrc}
                              alt={c.name}
                              fill
                              className="object-contain object-left"
                              sizes="144px"
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-full w-full rounded-lg bg-slate-100" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-base font-semibold text-slate-900">{c.name}</p>
                          <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                            {c.description?.trim() || tHome('sectorCompaniesListRowHint')}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        ) : null}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-blue-900 px-4 py-12 md:py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
            {sector.name} — {newsLabel}
          </h1>
          <p className="mx-auto max-w-3xl text-lg text-blue-200 md:text-xl">{heroDescription}</p>
        </div>
      </section>

      <SectorFeaturedBrandsGrid locale={locale} sectorSlug={sectorKey} bordered />

      {extraCompanies.length > 0 ? (
        <section aria-labelledby="sector-db-companies-heading" className="border-b border-slate-200 bg-white px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h2
              id="sector-db-companies-heading"
              className="mb-2 font-serif text-2xl font-bold text-slate-900 sm:text-3xl"
            >
              {tHome('sectorCompaniesListHeading')}
            </h2>
            <p className="mb-8 text-sm text-slate-600 sm:text-base">{tHome('sectorCompaniesListLead')}</p>
            <ul className="space-y-4">
              {extraCompanies.map((c) => {
                const href = `/companies/${c.slug}`;
                const logoSrc = normalizeStoredImage(c.logoImage);
                return (
                  <li key={c.id}>
                    <Link
                      href={href}
                      locale={locale}
                      className="flex items-center gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                    >
                      <div className="relative h-14 w-32 shrink-0 sm:h-16 sm:w-36">
                        {logoSrc ? (
                          <Image
                            src={logoSrc}
                            alt={c.name}
                            fill
                            className="object-contain object-left"
                            sizes="144px"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-full w-full rounded-lg bg-slate-100" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-slate-900">{c.name}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                          {c.description?.trim() || tHome('sectorCompaniesListRowHint')}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ) : null}

      {topicAnchors.length > 0 ? (
        <section
          aria-label={tBlog('focusAreasHeading')}
          className="border-b border-slate-200 bg-white px-4 py-10 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-slate-500 sm:text-left">
              {tBlog('focusAreasHeading')}
            </h2>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
              {topicAnchors.map((item) => {
                const id = topicAnchorIdFromHref(item.href);
                if (!id) return null;
                const body =
                  item.description?.trim() ||
                  tBlog('topicDescriptionFallback', {
                    label: item.label,
                    name: sector.name,
                  });
                return (
                  <div
                    key={id}
                    id={id}
                    className="scroll-mt-[7.5rem] rounded-2xl border border-slate-200 bg-slate-50/90 p-5 shadow-sm sm:scroll-mt-40"
                  >
                    <h3 className="text-base font-bold text-slate-900">{item.label}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {contentOnly ? null : (
        <section className="bg-slate-50 px-4 py-12 md:py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col gap-2 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                  {tBlog('recentPosts')}
                </h2>
                <p className="mt-1 text-sm text-slate-600">{tBlog('sectorNewsSubtitle')}</p>
              </div>
              {rows.length > 0 ? (
                <p className="text-sm text-slate-500">{tBlog('articlesCount', { count: total })}</p>
              ) : null}
            </div>

            {rows.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
                <p className="text-base font-medium text-slate-800">{tBlog('emptySectorTitle')}</p>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">{tBlog('emptySectorBody')}</p>
                <Link
                  href={allNewsHref}
                  locale={locale}
                  className="mt-6 inline-flex items-center rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
                >
                  {tBlog('browseAllNews')}
                  <ArrowRight size={16} className="ml-2" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {rows.map((post) => {
                  const excerpt = excerptForSectorBlogCard(post);
                  const readMinutes = estimateReadMinutesForCard(post);
                  const imageSrc = normalizeStoredImage(post.featuredImage);
                  return (
                    <article
                      key={post.slug}
                      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-xl"
                    >
                      <Link href={newsArticlePath(sector.slug, post.slug)} locale={locale} prefetch>
                        <div className="relative h-48 w-full shrink-0 overflow-hidden bg-slate-100">
                          {imageSrc ? (
                            <Image
                              src={imageSrc}
                              alt={post.title}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              className="object-cover"
                              loading="lazy"
                              fetchPriority="low"
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
                            <span className="text-xs text-slate-500">
                              {tBlog('minReadMinutes', { minutes: readMinutes })}
                            </span>
                            <span className="flex items-center text-sm font-semibold text-blue-600">
                              {tBlog('readMore')}
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
                  href={paginationHref(page - 1)}
                  locale={locale}
                  className={`rounded-lg border px-4 py-2 text-sm ${
                    page <= 1
                      ? 'pointer-events-none border-slate-200 text-slate-400'
                      : 'border-slate-300 text-slate-700 hover:bg-white'
                  }`}
                  prefetch={false}
                >
                  {tBlog('paginationPrevious')}
                </Link>
                <span className="text-sm text-slate-600">
                  {tBlog('paginationPage', { page, totalPages })}
                </span>
                <Link
                  href={paginationHref(page + 1)}
                  locale={locale}
                  className={`rounded-lg border px-4 py-2 text-sm ${
                    page >= totalPages
                      ? 'pointer-events-none border-slate-200 text-slate-400'
                      : 'border-slate-300 text-slate-700 hover:bg-white'
                  }`}
                  prefetch={false}
                >
                  {tBlog('paginationNext')}
                </Link>
              </div>
            ) : null}
          </div>
        </section>
      )}
    </div>
  );
}
