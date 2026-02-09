"use client";

import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { Calendar, ArrowLeft, Clock } from 'lucide-react';
const BLOG_POST_META: Record<string, { date: string; image: string }> = {
  'future-of-ecommerce-2026': { date: '2026-02-06', image: '/home.jpg' },
  'healthcare-technology-innovations': { date: '2026-02-06', image: '/about.jpg' },
  'sustainable-construction-practices': { date: '2026-02-06', image: '/home.jpg' },
  'digital-marketing-strategies': { date: '2026-02-06', image: '/about.jpg' },
  'ai-transformation-business': { date: '2026-02-06', image: '/home.jpg' },
  'global-trade-opportunities': { date: '2026-02-06', image: '/about.jpg' },
  'logistics-automation': { date: '2026-02-06', image: '/home.jpg' },
  'workforce-development-skills': { date: '2026-02-06', image: '/about.jpg' },
  'media-digital-transformation': { date: '2026-02-06', image: '/home.jpg' },
  'manufacturing-industry-4-0': { date: '2026-02-06', image: '/about.jpg' },
  'food-processing-innovation': { date: '2026-02-06', image: '/home.jpg' },
  'real-estate-investment-tips': { date: '2026-02-06', image: '/about.jpg' },
  'cloud-computing-benefits': { date: '2026-02-06', image: '/home.jpg' },
  'telemedicine-healthcare': { date: '2026-02-06', image: '/about.jpg' },
  'sustainable-business-practices': { date: '2026-02-06', image: '/home.jpg' },
  'customer-experience-digital-age': { date: '2026-02-06', image: '/about.jpg' },
  'data-security-best-practices': { date: '2026-02-06', image: '/home.jpg' },
  'remote-work-productivity': { date: '2026-02-06', image: '/home.jpg' },
  'supply-chain-resilience': { date: '2026-02-06', image: '/home.jpg' },
  'entrepreneurship-startup-success': { date: '2026-02-06', image: '/about.jpg' },
};

type Props = {
  slug: string;
  locale: string;
  blogContent: string;
  backToBlog: string;
  title: string;
  category: string;
  readTime: string;
};

export default function BlogPostClient({
  slug,
  locale,
  blogContent,
  backToBlog,
  title,
  category,
  readTime,
}: Props) {
  const meta = BLOG_POST_META[slug];

  if (!meta) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Blog Post Not Found</h1>
          <Link href="/blog" className="text-blue-600 hover:text-blue-800">
            {backToBlog}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-blue-900 py-12 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/blog"
            className="inline-flex items-center text-blue-200 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            {backToBlog}
          </Link>
          <div className="mb-4">
            <span className="px-3 py-1 bg-blue-500/20 text-blue-200 text-sm font-semibold rounded-full">
              {category}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            {title}
          </h1>
          <div className="flex items-center gap-4 text-blue-200 text-sm">
            <div className="flex items-center">
              <Calendar size={16} className="mr-2" />
              {new Date(meta.date).toLocaleDateString(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
            <div className="flex items-center">
              <Clock size={16} className="mr-2" />
              {readTime}
            </div>
          </div>
        </div>
      </section>

      <section className="relative h-64 md:h-96 w-full">
        <Image
          src={meta.image}
          alt={title}
          fill
          className="object-cover"
          priority
        />
      </section>

      <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <article className="max-w-4xl mx-auto">
          <div
            className="prose prose-slate prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: blogContent ?? '' }}
          />
        </article>
      </section>

      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/blog"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            {backToBlog}
          </Link>
        </div>
      </section>
    </div>
  );
}
