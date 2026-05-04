'use client';

import { Link } from '@/i18n/navigation';
import { Calendar, ArrowRight } from 'lucide-react';
import { m } from 'framer-motion';
import { useTranslations } from '@/lib/dictionary-react';
import MotionLazy from '@/components/motion/MotionLazy';
import NewsSectorNewsNav from '@/components/news/NewsSectorNewsNav';
import NewsCardFeaturedThumb from '@/components/news/NewsCardFeaturedThumb';
import { newsArticlePath } from '@/lib/news-paths';
import { NEWS_PUBLIC_LINK_LOCALE } from '@/lib/news-ui-locale';

export type NewsSectorPostItem = {
  slug: string;
  title: string;
  excerpt: string;
  image: string | null;
  publishedAt: string | null;
  readTime: string;
};

type Props = {
  locale: string;
  sectorSlug: string;
  sectorLabel: string;
  readMoreLabel: string;
  posts: NewsSectorPostItem[];
  initialSectorLiveMap?: Record<string, boolean>;
};

export default function NewsSectorBlogList({
  locale,
  sectorSlug,
  sectorLabel,
  readMoreLabel,
  posts,
  initialSectorLiveMap,
}: Props) {
  const t = useTranslations('Blog');

  return (
    <MotionLazy>
      <section className="border-t border-blue-100 bg-white py-12 sm:py-14 md:py-20">
        <div className="mx-auto w-full max-w-7xl min-w-0 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-8 xl:gap-10">
            <aside className="order-2 w-full min-w-0 max-w-full shrink-0 lg:order-1 lg:sticky lg:top-24 lg:w-72 lg:max-w-[18rem]">
              <NewsSectorNewsNav
                locale={locale}
                currentSlug={sectorSlug}
                initialSectorLiveMap={initialSectorLiveMap}
              />
            </aside>
            <div className="order-1 min-w-0 w-full flex-1 lg:order-2">
              {posts.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 p-8 text-center sm:p-10">
                  <p className="text-lg font-semibold text-blue-950">{t('emptySectorTitle')}</p>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-blue-900/80">
                    {t('emptySectorBody')}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-6 md:gap-8 lg:grid-cols-2 2xl:grid-cols-3">
                  {posts.map((post, index) => (
                    <m.article
                      key={post.slug}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.04 }}
                      className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border-2 border-blue-100 bg-white shadow-[0_2px_12px_rgba(30,58,138,0.06)] transition hover:border-blue-900 hover:shadow-[0_8px_30px_rgba(30,58,138,0.12)]"
                    >
                      <Link
                        href={newsArticlePath(sectorSlug, post.slug)}
                        locale={NEWS_PUBLIC_LINK_LOCALE}
                        className="flex h-full min-w-0 flex-col"
                      >
                        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-slate-100 sm:aspect-[5/3]">
                          {post.image ? (
                            <NewsCardFeaturedThumb
                              src={post.image}
                              alt={post.title}
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 45vw, (max-width: 1536px) 30vw, 360px"
                              loading="lazy"
                              fetchPriority="low"
                              className="transition duration-300 group-hover:opacity-95"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-800">
                              <span className="text-sm font-semibold tracking-wide text-white/90">News</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col p-4 sm:p-6">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-blue-900 bg-blue-900 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                              {sectorLabel}
                            </span>
                            {post.publishedAt ? (
                              <div className="flex items-center text-xs font-medium text-blue-900/70">
                                <Calendar size={14} className="mr-1 text-blue-800" aria-hidden />
                                {new Date(post.publishedAt).toLocaleDateString(locale, {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </div>
                            ) : null}
                          </div>
                          <h2 className="mb-3 line-clamp-2 text-lg font-bold leading-snug text-blue-950 transition-colors group-hover:text-blue-900 sm:text-xl">
                            {post.title}
                          </h2>
                          <p className="mb-5 line-clamp-3 flex-1 text-sm leading-relaxed text-blue-900/75">
                            {post.excerpt}
                          </p>
                          <div className="mt-auto flex items-center text-sm font-bold text-blue-900">
                            {readMoreLabel}
                            <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-0.5" />
                          </div>
                        </div>
                      </Link>
                    </m.article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </MotionLazy>
  );
}
