"use client";

import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { Calendar, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { BlogMessages } from '@/lib/messages';

const BLOG_SLUGS = [
  { slug: 'future-of-ecommerce-2026', date: '2026-02-06', image: '/home.jpg' },
  { slug: 'healthcare-technology-innovations', date: '2026-02-06', image: '/about.jpg' },
  { slug: 'sustainable-construction-practices', date: '2026-02-06', image: '/home.jpg' },
  { slug: 'digital-marketing-strategies', date: '2026-02-06', image: '/about.jpg' },
  { slug: 'ai-transformation-business', date: '2026-02-06', image: '/home.jpg' },
  { slug: 'global-trade-opportunities', date: '2026-02-06', image: '/about.jpg' },
  { slug: 'logistics-automation', date: '2026-02-06', image: '/home.jpg' },
  { slug: 'workforce-development-skills', date: '2026-02-06', image: '/about.jpg' },
  { slug: 'media-digital-transformation', date: '2026-02-06', image: '/home.jpg' },
  { slug: 'manufacturing-industry-4-0', date: '2026-02-06', image: '/about.jpg' },
  { slug: 'food-processing-innovation', date: '2026-02-06', image: '/home.jpg' },
  { slug: 'real-estate-investment-tips', date: '2026-02-06', image: '/about.jpg' },
  { slug: 'cloud-computing-benefits', date: '2026-02-06', image: '/home.jpg' },
  { slug: 'telemedicine-healthcare', date: '2026-02-06', image: '/about.jpg' },
  { slug: 'sustainable-business-practices', date: '2026-02-06', image: '/home.jpg' },
  { slug: 'customer-experience-digital-age', date: '2026-02-06', image: '/about.jpg' },
  { slug: 'data-security-best-practices', date: '2026-02-06', image: '/home.jpg' },
  { slug: 'remote-work-productivity', date: '2026-02-06', image: '/home.jpg' },
  { slug: 'supply-chain-resilience', date: '2026-02-06', image: '/home.jpg' },
  { slug: 'entrepreneurship-startup-success', date: '2026-02-06', image: '/about.jpg' },
];

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
              const postMsg = blog.posts[post.slug];
              const title = postMsg?.title ?? post.slug;
              const excerpt = postMsg?.excerpt ?? '';
              const category = postMsg?.category ?? '';
              return (
                <motion.article
                  key={post.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 border border-slate-200"
                >
                  <Link href={`/blog/${post.slug}`}>
                    <div className="relative h-48 w-full">
                      <Image
                        src={post.image}
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
                          {new Date(post.date).toLocaleDateString(locale, {
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
