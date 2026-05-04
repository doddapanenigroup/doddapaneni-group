import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import type { TranslateValues } from '@/lib/translation-format';
import { newsArticlePath, newsSectorListPath } from '@/lib/news-paths';
import { NEWS_PUBLIC_LINK_LOCALE } from '@/lib/news-ui-locale';
import type { NewsSectorPostItem } from '@/components/news/NewsSectorBlogList';

export type NewsHubSectionPayload = {
  slug: string;
  label: string;
  posts: NewsSectorPostItem[];
};

type TBlog = (key: string, values?: TranslateValues) => string;

type Props = {
  locale: string;
  sections: NewsHubSectionPayload[];
  t: TBlog;
};

function HubPostCard({
  locale,
  sectorSlug,
  sectorLabel,
  post,
  t,
}: {
  locale: string;
  sectorSlug: string;
  sectorLabel: string;
  post: NewsSectorPostItem;
  t: TBlog;
}) {
  const dateLine = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  /** Card sits in a responsive grid; sizes track approximate column width. */
  const thumbSizes =
    '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 300px';

  return (
    <article className="group flex h-full min-w-0 w-full flex-col rounded-md border border-slate-200 bg-white shadow-sm transition-shadow hover:border-slate-300 hover:shadow-md">
      <Link
        href={newsArticlePath(sectorSlug, post.slug)}
        locale={NEWS_PUBLIC_LINK_LOCALE}
        className="flex h-full min-w-0 flex-col"
      >
        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-t-md bg-slate-100">
          {post.image ? (
            <Image
              src={post.image}
              alt={post.title}
              fill
              sizes={thumbSizes}
              className="object-cover object-center transition duration-300 group-hover:opacity-95"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 px-3">
              <span className="max-w-full truncate text-center text-[10px] font-semibold uppercase tracking-wider text-white/90 sm:text-[11px]">
                {sectorLabel}
              </span>
            </div>
          )}
        </div>
        <div className="flex w-full min-w-0 flex-col px-2 pb-2 pt-1 sm:px-2.5 sm:pb-2.5 sm:pt-1.5">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500 sm:text-[10px]">{sectorLabel}</p>
          <h3 className="mt-0.5 line-clamp-2 text-xs font-bold leading-snug text-slate-900 group-hover:text-blue-800 sm:text-sm">
            {post.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-600 sm:text-xs">{post.excerpt}</p>
          <p className="mt-1.5 text-[11px] font-semibold text-blue-800 sm:text-xs">{t('hubReadMore')}</p>
          <p className="mt-1.5 border-t border-slate-100 pt-1.5 text-[9px] text-slate-500 sm:text-[10px]">
            {dateLine ? <span>{dateLine}</span> : null}
            {dateLine ? <span className="mx-1.5 text-slate-300">·</span> : null}
            <span>{t('hubNoComments')}</span>
          </p>
        </div>
      </Link>
    </article>
  );
}

export default function NewsBlogsHubSections({ locale, sections, t }: Props) {
  if (sections.length === 0) {
    return (
      <section className="px-3 py-6 sm:px-4 lg:px-5">
        <div className="mx-auto max-w-2xl rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center sm:px-5">
          <p className="text-sm font-semibold text-slate-800 sm:text-base">{t('emptySectorTitle')}</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">{t('emptySectorBody')}</p>
        </div>
      </section>
    );
  }

  return (
    <div className="bg-white">
      {sections.map((section, sectionIndex) => (
        <section
          key={section.slug}
          className={`border-b border-slate-200 px-3 py-4 sm:px-4 sm:py-5 lg:px-5 ${
            sectionIndex % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'
          }`}
        >
          <div className="mx-auto w-full max-w-[min(100%,1320px)]">
            <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">{section.label}</h2>
            {section.posts.length === 0 ? (
              <p className="mt-2 max-w-xl text-xs leading-relaxed text-slate-600 sm:text-sm">{t('emptySectorBody')}</p>
            ) : (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
                {section.posts.map((post) => (
                  <HubPostCard
                    key={post.slug}
                    locale={locale}
                    sectorSlug={section.slug}
                    sectorLabel={section.label}
                    post={post}
                    t={t}
                  />
                ))}
              </div>
            )}
            <div className="mt-3">
              <Link
                href={newsSectorListPath(section.slug)}
                locale={NEWS_PUBLIC_LINK_LOCALE}
                className="inline-flex text-[11px] font-semibold text-blue-800 underline decoration-2 underline-offset-2 transition hover:text-blue-950 sm:text-xs"
              >
                {t('hubViewAll', { label: section.label })}
              </Link>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
