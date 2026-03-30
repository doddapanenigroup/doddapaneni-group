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
      <section className="bg-blue-900 px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Link
            href={backLink}
            locale={locale}
            className="mb-6 inline-flex items-center text-sm font-semibold text-white/90 transition-colors hover:text-white"
          >
            <ArrowLeft size={20} className="mr-2 shrink-0" aria-hidden />
            {backToBlog}
          </Link>
          <div className="mb-4">
            <span className="inline-block rounded-full border-2 border-white/40 bg-white/10 px-4 py-1 text-sm font-bold text-white">
              {category}
            </span>
          </div>
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">{title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-white/90">
            {publishedAt ? (
              <div className="flex items-center">
                <Calendar size={16} className="mr-2 shrink-0 opacity-90" aria-hidden />
                {new Date(publishedAt).toLocaleDateString(locale, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            ) : null}
            <div className="flex items-center">
              <Clock size={16} className="mr-2 shrink-0 opacity-90" aria-hidden />
              {readTime}
            </div>
          </div>
        </div>
      </section>

      {image ? (
        <section className="relative h-64 min-h-64 w-full overflow-hidden bg-blue-50 md:h-96 md:min-h-96">
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

      <section className="bg-white px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <article className="mx-auto max-w-4xl">
          <div
            className="prose prose-lg max-w-none text-blue-950 prose-headings:text-blue-950 prose-headings:font-bold prose-p:text-blue-900/90 prose-a:font-semibold prose-a:text-blue-900 prose-a:no-underline hover:prose-a:underline prose-strong:text-blue-950 prose-li:text-blue-900/90"
            dangerouslySetInnerHTML={{ __html: blogContent ?? '' }}
          />
        </article>
      </section>

      {showEngagement ? (
        <NewsPostEngagement articleSlug={articleSlug} articleTitle={title} articlePathname={articlePathname} />
      ) : null}

      <section className="border-t-2 border-blue-100 bg-white px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Link
            href={backLink}
            locale={locale}
            className="inline-flex items-center text-base font-bold text-blue-900 transition-colors hover:text-blue-950"
          >
            <ArrowLeft size={20} className="mr-2 shrink-0" aria-hidden />
            {backToBlog}
          </Link>
        </div>
      </section>
    </div>
  );
}
