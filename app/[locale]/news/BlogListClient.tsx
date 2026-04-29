"use client";

import { Link } from '@/i18n/navigation';
import NewsCardFeaturedThumb from '@/components/news/NewsCardFeaturedThumb';
import { Calendar, ArrowRight } from 'lucide-react';
import { m } from 'framer-motion';
import MotionLazy from '@/components/motion/MotionLazy';
import type { BlogMessages } from '@/lib/messages';
import { NEWS_PUBLIC_LINK_LOCALE } from '@/lib/news-ui-locale';

type BlogListItem = {
  slug: string;
  href?: string;
  title: string;
  excerpt: string;
  image: string | null;
  publishedAt: string | null;
  readTime: string;
  category: string;
};

type Props = { locale: string; blog: BlogMessages; posts: BlogListItem[] };

export default function BlogListClient({ locale, blog, posts }: Props) {
  return (
    <MotionLazy>
    <div className="min-h-screen bg-white">
      <section className="bg-blue-900 px-4 py-8 sm:px-6 md:py-10 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="mb-2 text-2xl font-bold text-white md:text-3xl lg:text-4xl">
            {blog.title}
          </h1>
          <p className="mx-auto max-w-3xl text-sm text-blue-200 md:text-base">
            {blog.subtitle}
          </p>
        </div>
      </section>

      <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, index) => {
              return (
                <m.article
                  key={post.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 border border-slate-200"
                >
                  <Link href={post.href ?? `/news/${post.slug}`} locale={NEWS_PUBLIC_LINK_LOCALE}>
                    <div className="relative h-48 w-full shrink-0 overflow-hidden bg-slate-100">
                      {post.image ? (
                        <NewsCardFeaturedThumb
                          src={post.image}
                          alt={post.title}
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          loading="lazy"
                          fetchPriority="low"
                          className="transition duration-300 group-hover:opacity-95"
                        />
                      ) : (
                        <div className="h-full w-full bg-slate-200" />
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                          {post.category}
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
                      <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center text-blue-600 font-semibold text-sm">
                        {blog.readMore}
                        <ArrowRight size={16} className="ml-2" />
                      </div>
                    </div>
                  </Link>
                </m.article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
    </MotionLazy>
  );
}
