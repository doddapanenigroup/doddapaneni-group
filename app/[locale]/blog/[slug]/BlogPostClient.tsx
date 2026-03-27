"use client";

import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { Calendar, ArrowLeft, Clock } from 'lucide-react';

type Props = {
  locale: string;
  blogContent: string;
  backToBlog: string;
  title: string;
  category: string;
  readTime: string;
  image: string | null;
  publishedAt: string | null;
};

export default function BlogPostClient({
  locale,
  blogContent,
  backToBlog,
  title,
  category,
  readTime,
  image,
  publishedAt,
}: Props) {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-blue-900 py-12 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/blog"
            locale={locale}
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
            {publishedAt ? (
              <div className="flex items-center">
                <Calendar size={16} className="mr-2" />
                {new Date(publishedAt).toLocaleDateString(locale, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            ) : null}
            <div className="flex items-center">
              <Clock size={16} className="mr-2" />
              {readTime}
            </div>
          </div>
        </div>
      </section>

      {image ? (
        <section className="relative h-64 md:h-96 w-full">
          <Image
            src={image}
            alt={title}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        </section>
      ) : null}

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
            locale={locale}
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
