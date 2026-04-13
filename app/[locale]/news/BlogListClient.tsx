"use client";

import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { Calendar, ArrowRight } from 'lucide-react';
import { m } from 'framer-motion';
import MotionLazy from '@/components/motion/MotionLazy';
import type { BlogMessages } from '@/lib/messages';

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
      <section className="bg-blue-900 py-12 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            {blog.title}
          </h1>
          <p className="text-blue-200 text-lg md:text-xl max-w-3xl mx-auto">
            {blog.subtitle}
          </p>
          {blog.intro ? (
            <p className="mt-6 max-w-3xl mx-auto text-left text-sm leading-relaxed text-blue-100/95 sm:text-base md:text-center">
              {blog.intro}
            </p>
          ) : null}
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
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 border border-slate-200"
                >
                  <Link href={post.href ?? `/news/${post.slug}`} locale={locale}>
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
