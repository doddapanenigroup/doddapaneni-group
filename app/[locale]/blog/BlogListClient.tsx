"use client";

import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { Calendar, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { BlogMessages } from '@/lib/messages';
import { BLOG_POST_META } from '@/lib/blog-post-meta';

const BLOG_SLUGS = Object.keys(BLOG_POST_META);

type Props = { locale: string; blog: BlogMessages };

export default function BlogListClient({ locale, blog }: Props) {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-blue-900 py-12 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            {blog.title}
          </h1>
          <p className="text-blue-200 text-lg md:text-xl max-w-3xl mx-auto">
            {blog.subtitle}
          </p>
        </div>
      </section>

      <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {BLOG_SLUGS.map((post, index) => {
              const postMsg = blog.posts[post];
              const title = postMsg?.title ?? post;
              const excerpt = postMsg?.excerpt ?? '';
              const category = postMsg?.category ?? '';
              const meta = BLOG_POST_META[post];
              return (
                <motion.article
                  key={post}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 border border-slate-200"
                >
                  <Link href={`/blog/${post}`}>
                    <div className="relative h-48 w-full">
                      <Image
                        src={meta.image}
                        alt={title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                          {category}
                        </span>
                        <div className="flex items-center text-slate-500 text-xs">
                          <Calendar size={14} className="mr-1" />
                          {new Date(meta.date).toLocaleDateString(locale, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 hover:text-blue-600 transition-colors">
                        {title}
                      </h2>
                      <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                        {excerpt}
                      </p>
                      <div className="flex items-center text-blue-600 font-semibold text-sm">
                        {blog.readMore}
                        <ArrowRight size={16} className="ml-2" />
                      </div>
                    </div>
                  </Link>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
