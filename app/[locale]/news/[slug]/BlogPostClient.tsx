import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { Calendar, ArrowLeft, Clock } from 'lucide-react';
import NewsPostEngagement from '@/components/news/NewsPostEngagement';
import NewsSectorNewsNav from '@/components/news/NewsSectorNewsNav';
import { prepareBlogBodyHtml } from '@/lib/blog-content-display';

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
  /** When set, left sidebar lists all sector news hubs (division articles). */
  sectorNavSlug?: string;
  /** DB snapshot for sector “live” flags (sidebar matches navbar). */
  initialSectorLiveMap?: Record<string, boolean>;
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
  sectorNavSlug,
  initialSectorLiveMap,
  showEngagement = true,
}: Props) {
  const backLink = backHref ?? '/news';

  const articleBody = (
    <>
      {image ? (
        <section className="relative w-full overflow-hidden bg-blue-50">
          <div className="relative mx-auto h-[min(52vh,560px)] w-full min-h-[220px] sm:min-h-[260px] md:min-h-[340px] md:h-[min(58vh,640px)] lg:min-h-[400px] lg:h-[min(60vh,720px)]">
            <Image
              src={image}
              alt={title}
              sizes="(max-width: 1024px) 100vw, min(100vw, 896px)"
              width={1920}
              height={1080}
              className="h-full w-full object-cover object-center"
              loading="eager"
              fetchPriority="high"
            />
          </div>
        </section>
      ) : null}

      <section className="bg-white px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <article className="mx-auto max-w-4xl">
          <div
            className="prose prose-lg max-w-none text-blue-950 prose-headings:text-blue-950 prose-headings:font-bold prose-p:text-blue-900/90 prose-a:font-semibold prose-a:text-blue-900 prose-a:no-underline hover:prose-a:underline prose-strong:text-blue-950 prose-li:text-blue-900/90"
            dangerouslySetInnerHTML={{ __html: prepareBlogBodyHtml(blogContent) }}
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
    </>
  );

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-blue-900 px-4 pt-24 pb-6 sm:px-6 sm:pt-28 sm:pb-8 md:pt-28 md:pb-9 lg:pb-10">
        <div className="mx-auto max-w-4xl">
          <Link
            href={backLink}
            locale={locale}
            className="mb-3 inline-flex items-center text-sm font-semibold text-white/90 transition-colors hover:text-white"
          >
            <ArrowLeft size={18} className="mr-2 shrink-0" aria-hidden />
            {backToBlog}
          </Link>
          {sectorNavSlug ? null : (
            <div className="mb-2">
              <span className="inline-block rounded-full border border-white/35 bg-white/10 px-3 py-0.5 text-xs font-bold uppercase tracking-wide text-white sm:text-sm sm:normal-case sm:tracking-normal">
                {category}
              </span>
            </div>
          )}
          <h1 className="mb-3 text-2xl font-bold leading-snug tracking-tight text-white sm:text-3xl md:text-4xl lg:text-[2.35rem]">
            {title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-white/90 sm:text-sm">
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

      {sectorNavSlug ? (
        <div className="mt-6 border-t border-blue-100/80 px-5 pb-16 sm:mt-8 sm:px-8 lg:px-0">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-8">
            <aside className="order-2 shrink-0 lg:order-1 lg:sticky lg:top-24 lg:w-72 lg:shrink-0 lg:pl-12 lg:pr-0 xl:pl-16">
              <NewsSectorNewsNav
                locale={locale}
                currentSlug={sectorNavSlug}
                initialSectorLiveMap={initialSectorLiveMap}
              />
            </aside>
            <div className="order-1 min-w-0 flex-1 lg:order-2 lg:pr-12 xl:pr-16">{articleBody}</div>
          </div>
        </div>
      ) : (
        <div className="mt-6 border-t border-blue-100/80 sm:mt-8">{articleBody}</div>
      )}
    </div>
  );
}
