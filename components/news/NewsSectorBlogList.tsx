'use client';

import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { Calendar, ArrowRight } from 'lucide-react';
import { m } from 'framer-motion';
import { useTranslations } from 'next-intl';
import MotionLazy from '@/components/motion/MotionLazy';
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
      <section className="bg-slate-50 px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {posts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-600">
              <p className="font-semibold text-slate-800">{t('emptySectorTitle')}</p>
              <p className="mt-2 text-sm">{t('emptySectorBody')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post, index) => (
                <m.article
                  key={post.slug}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.04 }}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg"
                >
                  <Link href={newsArticlePath(sectorSlug, post.slug)} locale={locale}>
                    <div className="relative h-48 w-full shrink-0 overflow-hidden bg-slate-100">
                      {post.image ? (
                        <Image
                          src={post.image}
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
                      <div className="mb-3 flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                          {sectorLabel}
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
                      <h2 className="mb-3 line-clamp-2 text-xl font-bold text-slate-900 transition-colors hover:text-blue-600">
                        {post.title}
                      </h2>
                      <p className="mb-4 line-clamp-3 text-sm text-slate-600">{post.excerpt}</p>
                      <div className="flex items-center text-sm font-semibold text-blue-600">
                        {readMoreLabel}
                        <ArrowRight size={16} className="ml-2" />
                      </div>
                    </div>
                  </Link>
                </m.article>
              ))}
            </div>
          )}
        </div>
      </section>
    </MotionLazy>
  );
}
