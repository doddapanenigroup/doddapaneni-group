'use client';

import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { Calendar, ArrowRight } from 'lucide-react';
import { m } from 'framer-motion';
import { useTranslations } from 'next-intl';
import MotionLazy from '@/components/motion/MotionLazy';
import NewsSectorNewsNav from '@/components/news/NewsSectorNewsNav';
import { newsArticlePath } from '@/lib/news-paths';

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
};

export default function NewsSectorBlogList({
  locale,
  sectorSlug,
  sectorLabel,
  readMoreLabel,
  posts,
}: Props) {
  const t = useTranslations('Blog');

  return (
    <MotionLazy>
      <section className="border-t border-blue-100 bg-white px-4 py-14 sm:px-6 md:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
            <aside className="order-2 shrink-0 lg:order-1 lg:sticky lg:top-24 lg:w-72">
              <NewsSectorNewsNav locale={locale} currentSlug={sectorSlug} />
            </aside>
            <div className="order-1 min-w-0 flex-1 lg:order-2">
          {posts.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 p-10 text-center">
              <p className="text-lg font-semibold text-blue-950">{t('emptySectorTitle')}</p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-blue-900/80">
                {t('emptySectorBody')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
              {posts.map((post, index) => (
                <m.article
                  key={post.slug}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.04 }}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border-2 border-blue-100 bg-white shadow-[0_2px_12px_rgba(30,58,138,0.06)] transition hover:border-blue-900 hover:shadow-[0_8px_30px_rgba(30,58,138,0.12)]"
                >
                  <Link href={newsArticlePath(sectorSlug, post.slug)} locale={locale} className="flex h-full flex-col">
                    <div className="relative h-52 w-full shrink-0 overflow-hidden bg-blue-50">
                      {post.image ? (
                        <Image
                          src={post.image}
                          alt={post.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition duration-300 group-hover:scale-[1.02]"
                          loading="lazy"
                          fetchPriority="low"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-900 to-blue-800">
                          <span className="text-sm font-semibold tracking-wide text-white/90">News</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-6">
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
                      <h2 className="mb-3 line-clamp-2 text-xl font-bold leading-snug text-blue-950 transition-colors group-hover:text-blue-900">
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
