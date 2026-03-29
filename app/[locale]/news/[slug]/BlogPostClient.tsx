import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { Calendar, ArrowLeft, Clock } from 'lucide-react';
import NewsPostEngagement from '@/components/news/NewsPostEngagement';

type Props = {
  locale: string;
  blogContent: string;
  backToBlog: string;
  title: string;
  category: string;
  readTime: string;
  image: string | null;
  publishedAt: string | null;
  /** Path from site root for analytics/email, e.g. `/news/slug` or `/software-it-ai/slug`. */
  articlePathname: string;
  articleSlug: string;
  /** When set, “back” links go here instead of `/news` (e.g. `/news/software-it-ai`). */
  backHref?: string;
  /** Set false for draft preview routes. */
  showEngagement?: boolean;
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
  articlePathname,
  articleSlug,
  backHref,
  showEngagement = true,
}: Props) {
  const backLink = backHref ?? '/news';
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-blue-900 py-12 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Link
            href={backLink}
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
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">{title}</h1>
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
        <section className="relative h-64 min-h-64 w-full overflow-hidden bg-slate-100 md:h-96 md:min-h-96">
          <Image
            src={image}
            alt={title}
            fill
            sizes="100vw"
            className="object-cover"
            loading="lazy"
            fetchPriority="low"
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

      {showEngagement ? (
        <NewsPostEngagement articleSlug={articleSlug} articleTitle={title} articlePathname={articlePathname} />
      ) : null}

      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto">
          <Link
            href={backLink}
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
